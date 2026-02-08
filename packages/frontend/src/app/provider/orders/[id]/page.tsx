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
import { useToast } from "@/components/ui/toast";
import { formatPrice, formatDate } from "@/lib/utils";

export default function ProviderOrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [statusLogs, setStatusLogs] = useState<OrderStatusLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deliverables, setDeliverables] = useState("");

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

  const handleStartWork = async () => {
    try {
      await api.patch(`/api/v1/orders/${orderId}/start`, {});
      toast("Work started!", "success");
      const res = await api.get<Order>(`/api/v1/orders/${orderId}`);
      setOrder(res.data);
    } catch {
      toast("Failed to start work", "error");
    }
  };

  const handleDeliver = async () => {
    try {
      let parsedDeliverables: Record<string, unknown> = {};
      if (deliverables.trim()) {
        try {
          parsedDeliverables = JSON.parse(deliverables);
        } catch {
          parsedDeliverables = { notes: deliverables };
        }
      }
      await api.patch(`/api/v1/orders/${orderId}/deliver`, {
        deliverables: parsedDeliverables,
      });
      toast("Order delivered!", "success");
      const res = await api.get<Order>(`/api/v1/orders/${orderId}`);
      setOrder(res.data);
    } catch {
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
