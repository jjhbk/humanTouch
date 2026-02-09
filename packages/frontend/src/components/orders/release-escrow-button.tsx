"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const ESCROW_ABI = [
  {
    name: "release",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "escrowId", type: "bytes32" }],
    outputs: [],
  },
] as const;

const ESCROW_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

interface ReleaseEscrowButtonProps {
  orderId: string;
  escrowId: string | null;
  onReleased?: () => void;
}

export function ReleaseEscrowButton({
  orderId,
  escrowId,
  onReleased,
}: ReleaseEscrowButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const {
    writeContract,
    data: txHash,
    isPending: isReleasing,
  } = useWriteContract();

  const { isLoading: isWaiting, isSuccess: releaseConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash,
    });

  const handleRelease = async () => {
    if (!escrowId) {
      toast("Escrow ID not found", "error");
      return;
    }

    try {
      writeContract({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ESCROW_ABI,
        functionName: "release",
        args: [escrowId as `0x${string}`],
      });
    } catch (error: any) {
      console.error("Failed to release escrow:", error);
      toast(error.message || "Failed to release escrow", "error");
    }
  };

  // Update backend when release is confirmed
  if (releaseConfirmed && txHash) {
    api
      .post(`/orders/${orderId}/release-escrow`, {
        releaseTxHash: txHash,
      })
      .then(() => {
        toast("Payment released to provider!", "success");
        setIsOpen(false);
        onReleased?.();
      })
      .catch((error) => {
        console.error("Failed to update order:", error);
        toast("Release successful but failed to update order", "error");
      });
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="default"
        className="bg-green-600 hover:bg-green-700"
      >
        Release Payment to Provider
      </Button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>Release Escrow Payment</DialogTitle>
            <DialogDescription>
              This will release the escrowed funds to the provider. This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Make sure you have reviewed the provider's work and are satisfied
              before releasing payment.
            </p>
          </div>

          {escrowId && (
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-xs text-gray-600 mb-1">Escrow ID:</p>
              <p className="text-xs font-mono break-all">{escrowId}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isReleasing || isWaiting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRelease}
              disabled={isReleasing || isWaiting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isReleasing || isWaiting
                ? "Releasing..."
                : "Confirm Release"}
            </Button>
          </div>
        </div>
        </div>
      </Dialog>
    </>
  );
}
