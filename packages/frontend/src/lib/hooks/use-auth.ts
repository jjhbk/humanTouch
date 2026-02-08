"use client";

import { useAuthStore } from "../auth";

export function useAuth() {
  const store = useAuthStore();
  return store;
}
