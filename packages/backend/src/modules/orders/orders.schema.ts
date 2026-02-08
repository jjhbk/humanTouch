import { z } from "zod";

export const createOrderSchema = z.object({
  quoteId: z.string().min(1),
});

export const transitionOrderSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const deliverOrderSchema = z.object({
  deliverables: z.record(z.unknown()),
  reason: z.string().max(1000).optional(),
});
