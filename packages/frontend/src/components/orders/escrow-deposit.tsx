"use client";

import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEscrowDeposit } from "@/lib/hooks/use-escrow-deposit";
import { formatPrice } from "@/lib/utils";

interface EscrowDepositProps {
  orderId: string;
  amount: string;
  providerAddress: `0x${string}`;
}

export function EscrowDeposit({
  orderId,
  amount,
  providerAddress,
}: EscrowDepositProps) {
  const { isConnected } = useAccount();
  const {
    approve,
    deposit,
    isApproving,
    isDepositing,
    isApproved,
    depositConfirmed,
    txHash,
  } = useEscrowDeposit();

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-gray-500">
            Connect your wallet to deposit escrow.
          </p>
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
