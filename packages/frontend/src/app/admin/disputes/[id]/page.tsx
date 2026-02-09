"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatPrice } from "@/lib/utils";
import { DisputeChat } from "@/components/disputes/dispute-chat";
import type { Dispute } from "@humanlayer/shared";

const DISPUTE_STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "error"
> = {
  OPEN: "error",
  UNDER_REVIEW: "warning",
  RESOLVED: "success",
  REJECTED: "secondary",
};

interface DisputeWithDetails extends Dispute {
  order: {
    id: string;
    orderNumber: string;
    amount: string;
    status: string;
    buyer: { id: string; name: string | null; email: string };
    provider: { id: string; name: string | null; email: string };
  };
  raiser: { id: string; name: string | null; email: string };
  resolver?: { id: string; name: string | null; email: string };
}

export default function AdminDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;
  const { toast } = useToast();

  const [dispute, setDispute] = useState<DisputeWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolution, setResolution] = useState("");
  const [newOrderStatus, setNewOrderStatus] = useState<"COMPLETED" | "REFUNDED" | "CANCELLED">(
    "COMPLETED",
  );
  const [isResolving, setIsResolving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    async function fetchDispute() {
      setIsLoading(true);
      try {
        const res = await api.get<DisputeWithDetails>(`/disputes/${disputeId}`);
        setDispute(res.data);
      } catch (error) {
        console.error("Failed to fetch dispute:", error);
        toast("Failed to load dispute", "error");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDispute();
  }, [disputeId, toast]);

  const handleUpdateStatus = async (status: string) => {
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/disputes/${disputeId}/status`, { status });
      toast("Dispute status updated", "success");
      const res = await api.get<DisputeWithDetails>(`/disputes/${disputeId}`);
      setDispute(res.data);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast("Failed to update status", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      toast("Please provide a resolution description", "error");
      return;
    }

    setIsResolving(true);
    try {
      await api.post(`/disputes/${disputeId}/resolve`, {
        resolution,
        newOrderStatus,
      });
      toast("Dispute resolved successfully", "success");
      router.push("/admin/disputes");
    } catch (error: any) {
      console.error("Failed to resolve dispute:", error);
      toast(
        error.response?.data?.error?.message || "Failed to resolve dispute",
        "error",
      );
    } finally {
      setIsResolving(false);
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

  if (!dispute) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-gray-500">Dispute not found.</p>
        <Link href="/admin/disputes">
          <Button className="mt-4">Back to Disputes</Button>
        </Link>
      </div>
    );
  }

  const isResolved = dispute.status === "RESOLVED" || dispute.status === "REJECTED";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/disputes"
            className="text-sm text-primary-600 hover:underline mb-2 inline-block"
          >
            ← Back to Disputes
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Dispute for Order {dispute.order.orderNumber}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <Badge variant={DISPUTE_STATUS_VARIANTS[dispute.status]}>
              {dispute.status.replace("_", " ")}
            </Badge>
            <span className="text-sm text-gray-500">
              Opened {formatDate(dispute.createdAt)}
            </span>
          </div>
        </div>

        {!isResolved && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleUpdateStatus("UNDER_REVIEW")}
              disabled={isUpdatingStatus || dispute.status === "UNDER_REVIEW"}
            >
              Mark Under Review
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Order Number:</span>{" "}
              <Link
                href={`/orders/${dispute.order.id}`}
                className="text-primary-600 hover:underline"
              >
                {dispute.order.orderNumber}
              </Link>
            </div>
            <div>
              <span className="font-medium text-gray-700">Amount:</span>{" "}
              {formatPrice(dispute.order.amount)}
            </div>
            <div>
              <span className="font-medium text-gray-700">Order Status:</span>{" "}
              <Badge variant="secondary">{dispute.order.status}</Badge>
            </div>
            <div className="pt-2 border-t">
              <span className="font-medium text-gray-700">Buyer:</span>{" "}
              {dispute.order.buyer.name || dispute.order.buyer.email}
            </div>
            <div>
              <span className="font-medium text-gray-700">Provider:</span>{" "}
              {dispute.order.provider.name || dispute.order.provider.email}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispute Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Raised by:</span>{" "}
              {dispute.raiser.name || dispute.raiser.email}
            </div>
            <div>
              <span className="font-medium text-gray-700">Reason:</span>{" "}
              <span className="capitalize">{dispute.reason.replace(/_/g, " ")}</span>
            </div>
            <div className="pt-2">
              <span className="font-medium text-gray-700 block mb-1">
                Description:
              </span>
              <div className="bg-gray-50 rounded p-3 whitespace-pre-wrap">
                {dispute.description}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {dispute.resolution && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-green-900 whitespace-pre-wrap">
              {dispute.resolution}
            </p>
            <div className="text-xs text-green-700">
              Resolved by{" "}
              {dispute.resolver?.name || dispute.resolver?.email || "Admin"} on{" "}
              {dispute.resolvedAt && formatDate(dispute.resolvedAt)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispute Chat - Always show for communication */}
      <DisputeChat disputeId={disputeId} />

      {!isResolved && (
        <Card>
          <CardHeader>
            <CardTitle>Resolve Dispute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                New Order Status
              </label>
              <select
                value={newOrderStatus}
                onChange={(e) =>
                  setNewOrderStatus(
                    e.target.value as "COMPLETED" | "REFUNDED" | "CANCELLED",
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="COMPLETED">Completed (Release payment to provider)</option>
                <option value="REFUNDED">Refunded (Return payment to buyer)</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <Textarea
              label="Resolution Description"
              placeholder="Explain the decision and any actions taken..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={6}
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/disputes")}
                disabled={isResolving}
              >
                Cancel
              </Button>
              <Button onClick={handleResolve} disabled={isResolving}>
                {isResolving ? "Resolving..." : "Resolve Dispute"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
