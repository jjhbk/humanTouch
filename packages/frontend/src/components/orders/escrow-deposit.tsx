"use client";

import { useAccount } from "wagmi";
import { useEffect } from "react";
import { parseEventLogs } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEscrowDeposit } from "@/lib/hooks/use-escrow-deposit";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { HumanLayerEscrowABI } from "@humanlayer/shared";

interface EscrowDepositProps {
  orderId: string;
  amount: string;
  providerAddress: `0x${string}`;
  onDepositConfirmed?: () => void;
}

export function EscrowDeposit({
  orderId,
  amount,
  providerAddress,
  onDepositConfirmed,
}: EscrowDepositProps) {
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const {
    approve,
    deposit,
    isApproving,
    isDepositing,
    isApproved,
    depositConfirmed,
    txHash,
    depositReceipt,
    error,
    escrowAddress,
  } = useEscrowDeposit();

  // Update backend when deposit is confirmed
  useEffect(() => {
    async function updateOrderWithEscrow() {
      if (depositConfirmed && txHash && depositReceipt) {
        try {
          let escrowId: string | null = null;

          // Try to parse EscrowCreated event from transaction receipt
          try {
            const logs = parseEventLogs({
              abi: HumanLayerEscrowABI,
              logs: depositReceipt.logs,
              eventName: "EscrowCreated",
            });

            if (logs.length > 0) {
              escrowId = logs[0].args.escrowId as string;
              console.log("Extracted escrowId from parseEventLogs:", escrowId);
            }
          } catch (parseError) {
            console.warn("Event parsing failed, trying manual extraction...", parseError);
          }

          // Fallback: Manually extract escrowId from logs
          if (!escrowId) {
            const escrowCreatedSignature = "0xecfc64e6b5d00db90b689255403357841334dfc94584137e88c526dc65cbb713";
            const escrowLog = depositReceipt.logs.find(
              (log) => log.topics[0]?.toLowerCase() === escrowCreatedSignature.toLowerCase()
            );

            if (escrowLog && escrowLog.topics[1]) {
              escrowId = escrowLog.topics[1];
              console.log("Manually extracted escrowId from topics:", escrowId);
            }
          }

          if (!escrowId) {
            console.error("No EscrowCreated event found in transaction");
            toast("Deposit successful but escrowId not found. Using txHash as reference.", "warning");

            // Fallback to txHash
            await api.post(`/orders/${orderId}/confirm`, {
              escrowTxHash: txHash,
              escrowId: txHash,
              reason: "Escrow deposited (escrowId unavailable)",
            });
            onDepositConfirmed?.();
            return;
          }

          console.log("Final escrowId to save:", escrowId);

          await api.post(`/orders/${orderId}/confirm`, {
            escrowTxHash: txHash,
            escrowId: escrowId,
            reason: "Escrow deposited",
          });
          toast("Escrow deposit confirmed!", "success");
          onDepositConfirmed?.();
        } catch (error) {
          console.error("Failed to update order:", error);
          toast("Deposit successful but failed to update order status", "error");
        }
      }
    }
    updateOrderWithEscrow();
  }, [depositConfirmed, txHash, depositReceipt, orderId, toast, onDepositConfirmed]);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-gray-600">
            Connect your wallet to deposit <strong>{formatPrice(amount)}</strong> to escrow and confirm this order.
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (depositConfirmed) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-green-600">
            Escrow Deposited!
          </p>
          {txHash && (
            <p className="text-xs text-gray-400">Tx: {txHash}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escrow Deposit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Deposit <strong>{formatPrice(amount)}</strong> to escrow to confirm
          this order.
        </p>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800">{error}</p>
            {escrowAddress === "0x0000000000000000000000000000000000000000" && (
              <p className="text-xs text-red-600 mt-2">
                Run: <code className="bg-red-100 px-1 rounded">pnpm contracts:deploy:sepolia</code>
              </p>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-xs text-blue-800">
          <p className="font-medium mb-1">Contract Addresses:</p>
          <p className="font-mono break-all">Escrow: {escrowAddress}</p>
          <p className="font-mono break-all mt-1">Provider: {providerAddress}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold">
              1
            </span>
            <span className="text-sm">Approve USDC spending</span>
          </div>
          <Button
            onClick={() => approve(amount)}
            disabled={isApproving || isApproved}
            variant={isApproved ? "secondary" : "primary"}
            className="w-full"
          >
            {isApproving
              ? "Approving..."
              : isApproved
                ? "Approved"
                : "Approve USDC"}
          </Button>

          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold">
              2
            </span>
            <span className="text-sm">Deposit to escrow contract</span>
          </div>
          <Button
            onClick={() => deposit(orderId, amount, providerAddress)}
            disabled={!isApproved || isDepositing}
            className="w-full"
          >
            {isDepositing ? "Depositing..." : "Deposit to Escrow"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
