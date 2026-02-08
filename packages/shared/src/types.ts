// ============================================================
// Core Domain Types for HumanLayer
// ============================================================

export type UserRole = "BUYER" | "PROVIDER" | "ADMIN";

export interface User {
  id: string;
  email: string | null;
  walletAddress: string | null;
  role: UserRole;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderProfile {
  id: string;
  userId: string;
  businessName: string;
  description: string | null;
  websiteUrl: string | null;
  verificationStatus: VerificationStatus;
  stakeAmount: string; // Decimal as string
  averageRating: number | null;
  totalReviews: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
}

export type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED";

export interface Listing {
  id: string;
  providerId: string;
  title: string;
  slug: string;
  description: string;
  category: ListingCategory;
  pricingModel: PricingModel;
  basePrice: string; // Decimal as string
  currency: string;
  specifications: Record<string, unknown>;
  tags: string[];
  availableSlots: number;
  isActive: boolean;
  averageRating: number | null;
  totalReviews: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quote {
  id: string;
  listingId: string;
  requesterId: string;
  providerId: string;
  status: QuoteStatus;
  requirements: Record<string, unknown>;
  message: string | null;
  quotedPrice: string | null; // Decimal as string
  estimatedDays: number | null;
  providerNotes: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string; // HL-YYYY-NNNNN
  quoteId: string;
  buyerId: string;
  providerId: string;
  listingId: string;
  status: OrderStatus;
  amount: string; // Decimal as string
  escrowTxHash: string | null;
  escrowId: string | null;
  deliverables: Record<string, unknown> | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderStatusLog {
  id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: string;
  reason: string | null;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  txHash: string;
  type: TransactionType;
  fromAddress: string;
  toAddress: string;
  amount: string; // Decimal as string
  chainId: number;
  orderId: string | null;
  status: TransactionStatus;
  createdAt: Date;
}

export type TransactionType =
  | "ESCROW_DEPOSIT"
  | "ESCROW_RELEASE"
  | "ESCROW_REFUND"
  | "STAKE"
  | "UNSTAKE"
  | "SLASH";

export type TransactionStatus = "PENDING" | "CONFIRMED" | "FAILED";

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  providerId: string;
  listingId: string;
  rating: number; // 1-5
  comment: string | null;
  providerReply: string | null;
  providerRepliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// API Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// ============================================================
// Auth Types
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string; // user id
  role: UserRole;
  authMethod: "email" | "wallet" | "apikey";
}

export interface ApiKeyInfo {
  id: string;
  keyPrefix: string;
  label: string;
  permissions: string[];
  lastUsedAt: Date | null;
  createdAt: Date;
}

// ============================================================
// Listing Search Types
// ============================================================

export interface ListingSearchQuery extends PaginationQuery {
  category?: ListingCategory;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  minRating?: number;
  search?: string; // full-text on title+description
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest";
}

// ============================================================
// Enum-like types
// ============================================================

export type ListingCategory =
  | "WRITING"
  | "DESIGN"
  | "DEVELOPMENT"
  | "MARKETING"
  | "DATA_ENTRY"
  | "RESEARCH"
  | "TRANSLATION"
  | "CONSULTING"
  | "SUPPORT"
  | "OTHER";

export type PricingModel = "FIXED" | "HOURLY" | "PER_WORD" | "PER_UNIT" | "CUSTOM";

export type QuoteStatus =
  | "PENDING"
  | "RESPONDED"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "EXPIRED";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED"
  | "REFUNDED";
