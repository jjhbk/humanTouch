"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, AuthTokens } from "@humanlayer/shared";
import { api } from "./api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithWallet: (
    address: string,
    signMessage: (message: string) => Promise<string>,
  ) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const res = await api.post<{ user: User; tokens: AuthTokens }>(
          "/auth/login",
          { email, password },
        );
        set({
          user: res.data.user,
          accessToken: res.data.tokens.accessToken,
          refreshToken: res.data.tokens.refreshToken,
          isAuthenticated: true,
        });
      },

      register: async (email: string, password: string, name: string) => {
        const res = await api.post<{ user: User; tokens: AuthTokens }>(
          "/auth/register",
          { email, password, name },
        );
        set({
          user: res.data.user,
          accessToken: res.data.tokens.accessToken,
          refreshToken: res.data.tokens.refreshToken,
          isAuthenticated: true,
        });
      },

      loginWithWallet: async (
        address: string,
        signMessage: (message: string) => Promise<string>,
      ) => {
        // Step 1: Get SIWE nonce
        const nonceRes = await api.post<{ nonce: string }>(
          "/auth/wallet/nonce",
          { walletAddress: address }
        );

        // Step 2: Create SIWE message
        const message = [
          "HumanLayer wants you to sign in with your Ethereum account:",
          address,
          "",
          "Sign in to HumanLayer",
          "",
          `URI: ${window.location.origin}`,
          `Version: 1`,
          `Chain ID: 84532`,
          `Nonce: ${nonceRes.data.nonce}`,
          `Issued At: ${new Date().toISOString()}`,
        ].join("\n");

        // Step 3: Sign message
        const signature = await signMessage(message);

        // Step 4: Verify with backend
        const res = await api.post<{ user: User; tokens: AuthTokens }>(
          "/auth/wallet/verify",
          { message, signature },
        );
        set({
          user: res.data.user,
          accessToken: res.data.tokens.accessToken,
          refreshToken: res.data.tokens.refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return;
        }
        try {
          const res = await api.post<{ tokens: AuthTokens }>(
            "/auth/refresh",
            { refreshToken },
          );
          set({
            accessToken: res.data.tokens.accessToken,
            refreshToken: res.data.tokens.refreshToken,
          });
        } catch {
          get().logout();
        }
      },

      refreshUser: async () => {
        const { isAuthenticated } = get();
        if (!isAuthenticated) return;

        try {
          const res = await api.get<User>("/auth/me");
          set({ user: res.data });
        } catch {
          // If refreshing user fails, don't logout - might be a temporary error
          console.error("Failed to refresh user data");
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
