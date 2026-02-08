import { z } from "zod";

export const requestQuoteSchema = z.object({
  listingId: z.string().min(1),
  requirements: z.record(z.unknown()).default({}),
  message: z.string().max(2000).optional(),
});

export const respondQuoteSchema = z.object({
  quotedPrice: z.string().regex(/^\d+(\.\d{1,6})?$/),
  estimatedDays: z.number().int().min(1),
  providerNotes: z.string().max(2000).optional(),
  expiresAt: z.string().datetime().optional(),
});
