import { z } from "zod";

export const createListingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  category: z.enum([
    "WRITING", "DESIGN", "DEVELOPMENT", "MARKETING", "DATA_ENTRY",
    "RESEARCH", "TRANSLATION", "CONSULTING", "SUPPORT", "OTHER",
  ]),
  pricingModel: z.enum(["FIXED", "HOURLY", "PER_WORD", "PER_UNIT", "CUSTOM"]),
  basePrice: z.string().regex(/^\d+(\.\d{1,6})?$/),
  currency: z.string().default("USDC"),
  specifications: z.record(z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
  availableSlots: z.number().int().min(0).default(1),
});

export const updateListingSchema = createListingSchema.partial();

export const searchListingsSchema = z.object({
  category: z.enum([
    "WRITING", "DESIGN", "DEVELOPMENT", "MARKETING", "DATA_ENTRY",
    "RESEARCH", "TRANSLATION", "CONSULTING", "SUPPORT", "OTHER",
  ]).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  tags: z.string().transform((s) => s.split(",")).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "rating", "newest"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
