"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatPrice } from "@/lib/utils";
import { DisputeChat } from "@/components/disputes/dispute-chat";
import { HumanLayerEscrowABI } from "@humanlayer/shared";
import type { Dispute } from "@humanlayer/shared";

const ESCROW_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

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
    escrowId: string | null;
    escrowTxHash: string | null;
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
  const { isConnected } = useAccount();

  const [dispute, setDispute] = useState<DisputeWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolution, setResolution] = useState("");
  const [newOrderStatus, setNewOrderStatus] = useState<"COMPLETED" | "REFUNDED" | "CANCELLED">(
    "COMPLETED",
  );
  const [isResolving, setIsResolving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [releaseTxHash, setReleaseTxHash] = useState<string | null>(null);
  const [refundTxHash, setRefundTxHash] = useState<string | null>(null);

  const {
    writeContract: writeRelease,
    data: releaseTxHashData,
    isPending: isReleasingEscrow,
  } = useWriteContract();

  const {
    writeContract: writeRefund,
    data: refundTxHashData,
    isPending: isRefundingEscrow,
  } = useWriteContract();

  const { isLoading: isWaitingRelease, isSuccess: releaseConfirmed } =
    useWaitForTransactionReceipt({
      hash: releaseTxHashData,
    });

  const { isLoading: isWaitingRefund, isSuccess: refundConfirmed } =
    useWaitForTransactionReceipt({
      hash: refundTxHashData,
    });

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

  // Update releaseTxHash when blockchain transaction confirms
  useEffect(() => {
    if (releaseConfirmed && releaseTxHashData) {
      setReleaseTxHash(releaseTxHashData);
      toast("Escrow released to provider successfully!", "success");
    }
  }, [releaseConfirmed, releaseTxHashData, toast]);

  // Update refundTxHash when blockchain refund confirms
  useEffect(() => {
    if (refundConfirmed && refundTxHashData) {
      setRefundTxHash(refundTxHashData);
      toast("Escrow refunded to buyer successfully!", "success");
    }
  }, [refundConfirmed, refundTxHashData, toast]);

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

  const handleReleaseEscrow = () => {
    if (!isConnected) {
      toast("Please connect your wallet first", "error");
      return;
    }

    if (!dispute?.order.escrowId) {
      toast("No escrow ID found for this order", "error");
      return;
    }

    const escrowId = dispute.order.escrowId;

    if (!escrowId.startsWith('0x') || escrowId.length !== 66) {
      toast("Invalid escrow ID format", "error");
      return;
    }

    if (ESCROW_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      toast("Escrow contract not configured", "error");
      return;
    }

    try {
      writeRelease({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: HumanLayerEscrowABI,
        functionName: "release",
        args: [escrowId as `0x${string}`],
      });
    } catch (error: any) {
      console.error("Failed to release escrow:", error);
      toast(error.message || "Failed to release escrow", "error");
    }
  };

  const handleRefundEscrow = () => {
    if (!isConnected) {
      toast("Please connect your wallet first", "error");
      return;
    }

    if (!dispute?.order.escrowId) {
      toast("No escrow ID found for this order", "error");
      return;
    }

    const escrowId = dispute.order.escrowId;

    if (!escrowId.startsWith('0x') || escrowId.length !== 66) {
      toast("Invalid escrow ID format", "error");
      return;
    }

    if (ESCROW_CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      toast("Escrow contract not configured", "error");
      return;
    }

    try {
      writeRefund({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: HumanLayerEscrowABI,
        functionName: "refund",
        args: [escrowId as `0x${string}`],
      });
    } catch (error: any) {
      console.error("Failed to refund escrow:", error);
      toast(error.message || "Failed to refund escrow", "error");
    }
  };

  const handleResolve = async () => {
    if (!resolution.trim()) {
      toast("Please provide a resolution description", "error");
      return;
    }

    // If COMPLETED status but no escrow release tx, warn user
    if (newOrderStatus === "COMPLETED" && dispute?.order.escrowId && !releaseTxHash) {
      toast("Please release escrow payment first before resolving as COMPLETED", "error");
      return;
    }

    // If REFUNDED status but no escrow refund tx, warn user
    if (newOrderStatus === "REFUNDED" && dispute?.order.escrowId && !refundTxHash) {
      toast("Please refund escrow payment first before resolving as REFUNDED", "error");
      return;
    }

    setIsResolving(true);
    try {
      await api.post(`/disputes/${disputeId}/resolve`, {
        resolution,
        newOrderStatus,
        releaseTxHash: releaseTxHash || refundTxHash || undefined,
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

            {/* Show escrow release section if COMPLETED and escrowId exists */}
            {newOrderStatus === "COMPLETED" && dispute?.order.escrowId && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
                <p className="text-sm font-medium text-blue-900">
                  Step 1: Release Escrow Payment to Provider
                </p>
                <p className="text-xs text-blue-700">
                  Before marking as COMPLETED, you must release the escrowed funds to the provider via blockchain transaction.
                </p>
                {!isConnected ? (
                  <div className="space-y-2">
                    <p className="text-xs text-blue-700">Connect your wallet to release escrow:</p>
                    <ConnectButton />
                  </div>
                ) : releaseTxHash ? (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-xs font-medium text-green-800 mb-1">
                      ✓ Escrow Released to Provider
                    </p>
                    <p className="text-xs text-green-700 font-mono break-all">
                      Tx: {releaseTxHash}
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleReleaseEscrow}
                    disabled={isReleasingEscrow || isWaitingRelease}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isReleasingEscrow || isWaitingRelease
                      ? "Releasing Escrow..."
                      : "Release Escrow to Provider"}
                  </Button>
                )}
              </div>
            )}

            {/* Show escrow refund section if REFUNDED and escrowId exists */}
            {newOrderStatus === "REFUNDED" && dispute?.order.escrowId && (
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4 space-y-3">
                <p className="text-sm font-medium text-orange-900">
                  Step 1: Refund Escrow Payment to Buyer
                </p>
                <p className="text-xs text-orange-700">
                  Before marking as REFUNDED, you must refund the escrowed funds to the buyer via blockchain transaction. Only the contract owner can call this function.
                </p>
                {!isConnected ? (
                  <div className="space-y-2">
                    <p className="text-xs text-orange-700">Connect your wallet to refund escrow:</p>
                    <ConnectButton />
                  </div>
                ) : refundTxHash ? (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-xs font-medium text-green-800 mb-1">
                      ✓ Escrow Refunded to Buyer
                    </p>
                    <p className="text-xs text-green-700 font-mono break-all">
                      Tx: {refundTxHash}
                    </p>
                  </div>
                ) : (
                  <Button
                    onClick={handleRefundEscrow}
                    disabled={isRefundingEscrow || isWaitingRefund}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    {isRefundingEscrow || isWaitingRefund
                      ? "Refunding Escrow..."
                      : "Refund Escrow to Buyer"}
                  </Button>
                )}
              </div>
            )}

            {newOrderStatus === "COMPLETED" && !dispute?.order.escrowId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ No escrow ID found. The order will be marked as COMPLETED without releasing funds through the smart contract.
                </p>
              </div>
            )}

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
