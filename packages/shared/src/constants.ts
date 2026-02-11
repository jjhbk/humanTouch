import type { OrderStatus, QuoteStatus } from "./types";

// ============================================================
// Order State Machine
// ============================================================

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED", "COMPLETED"],
  IN_PROGRESS: ["DELIVERED", "DISPUTED", "CANCELLED", "COMPLETED"],
  DELIVERED: ["COMPLETED", "DISPUTED"],
  COMPLETED: [],
  DISPUTED: ["REFUNDED", "IN_PROGRESS"],
  CANCELLED: [],
  REFUNDED: [],
};

export function isValidOrderTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================
// Quote State Machine
// ============================================================

export const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  PENDING: ["RESPONDED", "WITHDRAWN", "EXPIRED"],
  RESPONDED: ["ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
  EXPIRED: [],
};

export function isValidQuoteTransition(
  from: QuoteStatus,
  to: QuoteStatus
): boolean {
  return QUOTE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================
// Category Labels
// ============================================================

export const LISTING_CATEGORIES = [
  "WRITING",
  "DESIGN",
  "DEVELOPMENT",
  "MARKETING",
  "DATA_ENTRY",
  "RESEARCH",
  "TRANSLATION",
  "CONSULTING",
  "SUPPORT",
  "OTHER",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  WRITING: "Writing & Content",
  DESIGN: "Design & Creative",
  DEVELOPMENT: "Development & Tech",
  MARKETING: "Marketing & SEO",
  DATA_ENTRY: "Data Entry",
  RESEARCH: "Research & Analysis",
  TRANSLATION: "Translation",
  CONSULTING: "Consulting",
  SUPPORT: "Support & VA",
  OTHER: "Other",
};

// ============================================================
// Pricing Model Labels
// ============================================================

export const PRICING_MODELS = [
  "FIXED",
  "HOURLY",
  "PER_WORD",
  "PER_UNIT",
  "CUSTOM",
] as const;

export const PRICING_MODEL_LABELS: Record<string, string> = {
  FIXED: "Fixed Price",
  HOURLY: "Hourly Rate",
  PER_WORD: "Per Word",
  PER_UNIT: "Per Unit",
  CUSTOM: "Custom Quote",
};

// ============================================================
// Order Status Labels
// ============================================================

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending Payment",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

// ============================================================
// Blockchain Constants
// ============================================================

export const CHAIN_CONFIG = {
  baseSepolia: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  baseMainnet: {
    chainId: 8453,
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
} as const;

export const USDC_DECIMALS = 6;
export const PLATFORM_FEE_BPS = 250; // 2.5%

// ============================================================
// API Defaults
// ============================================================

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================================
// API Key Prefix
// ============================================================

export const API_KEY_PREFIX = "hl_live_";
