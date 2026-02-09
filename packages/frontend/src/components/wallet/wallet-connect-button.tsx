"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage } from "wagmi";
import { useAuth } from "@/lib/hooks/use-auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { loginWithWallet, user, logout } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (isConnected && address && !user && !isAuthenticating) {
      handleWalletAuth();
    }
  }, [isConnected, address, user]);

  const handleWalletAuth = async () => {
    if (!address || !signMessageAsync) return;

    setIsAuthenticating(true);
    try {
      await loginWithWallet(address, async (message: string) => {
        const signature = await signMessageAsync({ message });
        return signature;
      });
    } catch (error) {
      console.error("Wallet authentication failed:", error);
      // Don't log out on error - let user retry
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <ConnectButton showBalance={false} chainStatus="icon" />
      {isConnected && !user && (
        <Button
          size="sm"
          onClick={handleWalletAuth}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? "Signing..." : "Sign In"}
        </Button>
      )}
    </div>
  );
}
