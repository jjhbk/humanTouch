import { USDC_DECIMALS } from "./constants";

/**
 * Generate a URL-safe slug from a title
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate an order number in the format HL-YYYY-NNNNN
 */
export function generateOrderNumber(sequenceNum: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequenceNum).padStart(5, "0");
  return `HL-${year}-${padded}`;
}

/**
 * Format USDC amount from chain (6 decimals) to human-readable string
 */
export function formatUSDC(amount: bigint | string): string {
  const value =
    typeof amount === "string" ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** USDC_DECIMALS);
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionStr = fraction.toString().padStart(USDC_DECIMALS, "0");
  // Trim trailing zeros but keep at least 2 decimal places
  const trimmed = fractionStr.replace(/0+$/, "").padEnd(2, "0");
  return `${whole}.${trimmed}`;
}

/**
 * Parse a human-readable USDC string to chain amount (6 decimals)
 */
export function parseUSDC(amount: string): bigint {
  const [whole = "0", fraction = ""] = amount.split(".");
  const paddedFraction = fraction
    .slice(0, USDC_DECIMALS)
    .padEnd(USDC_DECIMALS, "0");
  return BigInt(whole) * BigInt(10 ** USDC_DECIMALS) + BigInt(paddedFraction);
}

/**
 * Truncate an Ethereum address for display
 */
export function truncateAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Clamp page/limit for pagination
 */
export function clampPagination(
  page?: number,
  limit?: number,
  maxLimit = 100
): { page: number; limit: number; skip: number } {
  const p = Math.max(1, page ?? 1);
  const l = Math.min(maxLimit, Math.max(1, limit ?? 20));
  return { page: p, limit: l, skip: (p - 1) * l };
}
