import { z } from "zod";

export const updateProfileSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  websiteUrl: z.string().url().optional(),
});

export const updateStakeSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
});
