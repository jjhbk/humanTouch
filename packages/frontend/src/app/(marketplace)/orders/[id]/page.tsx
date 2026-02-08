"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Order, OrderStatusLog } from "@humanlayer/shared";
import { ORDER_STATUS_LABELS } from "@humanlayer/shared";
import { api } from "@/lib/api";
import { Badge, getOrderStatusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { EscrowDeposit } from "@/components/orders/escrow-deposit";
import { useToast } from "@/components/ui/toast";
import { formatPrice, formatDate } from "@/lib/utils";

export default function BuyerOrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [statusLogs, setStatusLogs] = useState<OrderStatusLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);
      try {
        const res = await api.get<Order>(`/api/v1/orders/${orderId}`);
        setOrder(res.data);
        try {
          const logsRes = await api.get<OrderStatusLog[]>(
            `/api/v1/orders/${orderId}/status-logs`,
          );
          setStatusLogs(logsRes.data);
        } catch {
          // May not exist yet
        }
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const handleComplete = async () => {
    try {
      await api.patch(`/api/v1/orders/${orderId}/complete`, {});
      toast("Order marked as complete!", "success");
      const res = await api.get<Order>(`/api/v1/orders/${orderId}`);
      setOrder(res.data);
    } catch {
      toast("Failed to complete order", "error");
    }
  };

  const handleReview = async () => {
    try {
      await api.post("/api/v1/reviews", {
        orderId,
        rating: reviewRating,
        comment: reviewComment || null,
      });
      toast("Review submitted!", "success");
    } catch {
      toast("Failed to submit review", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-gray-500">Order not found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Order {order.orderNumber}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant={getOrderStatusVariant(order.status)}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
            <span className="text-sm text-gray-500">
              Created {formatDate(order.createdAt)}
            </span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Amount:</span>{" "}
              {formatPrice(order.amount)}
            </p>
            {order.escrowTxHash && (
              <p>
                <span className="font-medium">Escrow Tx:</span>{" "}
                <span className="font-mono text-xs">{order.escrowTxHash}</span>
              </p>
            )}
            {order.deliverables && (
              <div>
                <span className="font-medium">Deliverables:</span>
                <pre className="mt-1 rounded bg-gray-50 p-2 text-xs">
                  {JSON.stringify(order.deliverables, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {order.status === "PENDING" && (
          <EscrowDeposit
            orderId={order.id}
            amount={order.amount}
            providerAddress={"0x0000000000000000000000000000000000000000"}
          />
        )}

        {order.status === "DELIVERED" && (
          <Card>
            <CardContent className="p-6">
              <p className="mb-4 text-sm text-gray-600">
                The provider has delivered the work. Review and mark as
                complete.
              </p>
              <Button onClick={handleComplete}>Mark as Complete</Button>
            </CardContent>
          </Card>
        )}

        {order.status === "COMPLETED" && (
          <Card>
            <CardHeader>
              <CardTitle>Leave a Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setReviewRating(r)}
                      className={`h-10 w-10 rounded-md text-sm font-medium ${
                        r <= reviewRating
                          ? "bg-yellow-400 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                label="Comment (optional)"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
              <Button onClick={handleReview}>Submit Review</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <OrderTimeline statusLogs={statusLogs} currentStatus={order.status} />
      </div>
    </div>
  );
}
