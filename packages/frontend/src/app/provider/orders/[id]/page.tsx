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
import { OrderChat } from "@/components/messages/order-chat";
import { DisputeForm } from "@/components/disputes/dispute-form";
import { DisputeDetails } from "@/components/disputes/dispute-details";
import { DisputeChat } from "@/components/disputes/dispute-chat";
import { useToast } from "@/components/ui/toast";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Dispute } from "@humanlayer/shared";

export default function ProviderOrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [statusLogs, setStatusLogs] = useState<OrderStatusLog[]>([]);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deliverables, setDeliverables] = useState("");

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

  const handleStartWork = async () => {
    try {
      await api.post(`/orders/${orderId}/start`, {});
      toast("Work started!", "success");
      const res = await api.get<Order>(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (error) {
      console.error("Failed to start work:", error);
      toast("Failed to start work", "error");
    }
  };

  const handleDeliver = async () => {
    if (!deliverables.trim()) {
      toast("Please provide deliverables", "error");
      return;
    }

    try {
      let parsedDeliverables: Record<string, unknown> = {};
      try {
        parsedDeliverables = JSON.parse(deliverables);
      } catch {
        parsedDeliverables = { notes: deliverables };
      }

      await api.post(`/orders/${orderId}/deliver`, {
        deliverables: parsedDeliverables,
      });
      toast("Order delivered!", "success");
      const res = await api.get<Order>(`/orders/${orderId}`);
      setOrder(res.data);
      setDeliverables("");
    } catch (error) {
      console.error("Failed to deliver order:", error);
      toast("Failed to deliver order", "error");
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
              {formatDate(order.createdAt)}
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
          </CardContent>
        </Card>

        {/* Dispute Section */}
        {dispute ? (
          <>
            <DisputeDetails dispute={dispute} />
            <DisputeChat disputeId={dispute.id} />
          </>
        ) : (
          order.status !== "PENDING" &&
          order.status !== "COMPLETED" &&
          order.status !== "CANCELLED" &&
          order.status !== "REFUNDED" && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Having Issues?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  If you're experiencing problems with this order, you can open a
                  dispute for review.
                </p>
                <DisputeForm
                  orderId={order.id}
                  onDisputeCreated={async () => {
                    console.log("Dispute created, refreshing data...");
                    try {
                      const res = await api.get<Order>(`/orders/${orderId}`);
                      setOrder(res.data);
                      console.log("Order refreshed, fetching dispute...");
                      const disputeRes = await api.get<Dispute>(
                        `/disputes/order/${orderId}`,
                      );
                      console.log("Dispute data:", disputeRes.data);
                      setDispute(disputeRes.data);
                      toast("Dispute opened successfully", "success");
                    } catch (error) {
                      console.error("Error refreshing after dispute creation:", error);
                      toast("Dispute created but UI refresh failed. Please reload page.", "error");
                    }
                  }}
                />
              </CardContent>
            </Card>
          )
        )}

        {order.status === "CONFIRMED" && (
          <Card>
            <CardContent className="p-6">
              <p className="mb-4 text-sm text-gray-600">
                Escrow has been deposited. You can now start working on this
                order.
              </p>
              <Button onClick={handleStartWork}>Start Work</Button>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        {order.status !== "PENDING" && (
          <OrderChat
            orderId={order.id}
            otherPartyName={
              (order as any).buyer?.name ||
              (order as any).buyer?.email ||
              "Buyer"
            }
          />
        )}

        {order.status === "IN_PROGRESS" && (
          <Card>
            <CardHeader>
              <CardTitle>Mark as Delivered</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                label="Deliverables (JSON or notes)"
                placeholder='{"files": ["report.pdf"], "notes": "Completed as requested"}'
                value={deliverables}
                onChange={(e) => setDeliverables(e.target.value)}
              />
              <Button onClick={handleDeliver}>Mark as Delivered</Button>
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
