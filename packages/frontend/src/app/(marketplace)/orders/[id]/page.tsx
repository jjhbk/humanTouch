"use client";

import { useEffect, useState, useCallback } from "react";
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
import { OrderChat } from "@/components/messages/order-chat";
import { DisputeForm } from "@/components/disputes/dispute-form";
import { DisputeDetails } from "@/components/disputes/dispute-details";
import { DisputeChat } from "@/components/disputes/dispute-chat";
import { ReleaseEscrowButton } from "@/components/orders/release-escrow-button";
import { useToast } from "@/components/ui/toast";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Dispute } from "@humanlayer/shared";

export default function BuyerOrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [statusLogs, setStatusLogs] = useState<OrderStatusLog[]>([]);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);
      try {
        const res = await api.get<Order>(`/orders/${orderId}`);
        setOrder(res.data);
        try {
          const logsRes = await api.get<OrderStatusLog[]>(
            `/orders/${orderId}/status-logs`,
          );
          setStatusLogs(logsRes.data);
        } catch {
          // May not exist yet
        }

        // Fetch dispute if exists
        try {
          const disputeRes = await api.get<Dispute>(`/disputes/order/${orderId}`);
          console.log("Dispute fetched:", disputeRes.data);
          setDispute(disputeRes.data);
        } catch (error: any) {
          console.log("No dispute found or error:", error.response?.status);
          // No dispute exists (404 is expected if no dispute)
        }
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const refreshOrder = useCallback(async () => {
    const res = await api.get<Order>(`/orders/${orderId}`);
    setOrder(res.data);
  }, [orderId]);

  const handleComplete = async () => {
    try {
      await api.post(`/orders/${orderId}/complete`, {});
      toast("Order marked as complete!", "success");
      const res = await api.get<Order>(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (error) {
      console.error("Failed to complete order:", error);
      toast("Failed to complete order", "error");
    }
  };

  const handleReview = async () => {
    try {
      await api.post("/reviews", {
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
          <>
            {!(order as any).provider?.walletAddress ? (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    Provider Wallet Not Connected
                  </h3>
                  <p className="text-sm text-yellow-800">
                    The provider needs to connect their wallet address before you can deposit to escrow.
                    Please wait for the provider to update their account with a wallet address.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <EscrowDeposit
                orderId={order.id}
                amount={order.amount}
                providerAddress={(order as any).provider.walletAddress as `0x${string}`}
                onDepositConfirmed={refreshOrder}
              />
            )}
          </>
        )}

        {/* Release Escrow or Dispute - Show for active orders */}
        {!dispute &&
         order.status !== "PENDING" &&
         order.status !== "COMPLETED" &&
         order.status !== "CANCELLED" &&
         order.status !== "REFUNDED" && (
          <Card className="border-2 border-primary-200">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Order Actions
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Release payment to provider or open a dispute if there are issues
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <ReleaseEscrowButton
                  orderId={order.id}
                  escrowId={order.escrowId || null}
                  onReleased={refreshOrder}
                />
                <DisputeForm
                  orderId={order.id}
                  onDisputeCreated={async () => {
                    try {
                      await refreshOrder();
                      const disputeRes = await api.get<Dispute>(
                        `/disputes/order/${orderId}`,
                      );
                      setDispute(disputeRes.data);
                      toast("Dispute opened successfully", "success");
                    } catch (error) {
                      console.error("Error refreshing after dispute creation:", error);
                      toast("Dispute created but UI refresh failed. Please reload page.", "error");
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dispute Details and Chat */}
        {dispute ? (
          <>
            <DisputeDetails dispute={dispute} />
            <DisputeChat disputeId={dispute.id} />
          </>
        ) : (
          order.status === "DISPUTED" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <p className="text-sm text-yellow-800">
                  This order has a dispute, but details couldn't be loaded. Please refresh the page.
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </CardContent>
            </Card>
          )
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

        {/* Messages */}
        {order.status !== "PENDING" && (
          <OrderChat
            orderId={order.id}
            otherPartyName={
              (order as any).provider?.name ||
              (order as any).provider?.email ||
              "Provider"
            }
          />
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
