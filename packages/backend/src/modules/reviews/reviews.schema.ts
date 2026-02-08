import { z } from "zod";

export const submitReviewSchema = z.object({
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const replyReviewSchema = z.object({
  reply: z.string().min(1).max(2000),
});

export const listReviewsSchema = z.object({
  listingId: z.string().optional(),
  providerId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
