"use client";

import Link from "next/link";
import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/listings" className="text-xl font-bold text-primary-600">
            HumanLayer
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/listings"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Browse
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/quotes"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  My Quotes
                </Link>
                {user?.role === "PROVIDER" ? (
                  <Link
                    href="/provider/dashboard"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    Provider Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/become-provider"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Become a Provider
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <WalletConnectButton />
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user?.name ?? user?.email ?? "User"}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
