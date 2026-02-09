import { z } from "zod";

export const createDisputeSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, "Order ID is required"),
    reason: z.string().min(1, "Reason is required"),
    description: z.string().min(10, "Description must be at least 10 characters"),
  }),
});

export const resolveDisputeSchema = z.object({
  body: z.object({
    resolution: z.string().min(10, "Resolution description must be at least 10 characters"),
    newOrderStatus: z.enum(["COMPLETED", "REFUNDED", "CANCELLED"]),
  }),
});

export const updateDisputeStatusSchema = z.object({
  body: z.object({
    status: z.enum(["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"]),
  }),
});

export const addCommentSchema = z.object({
  body: z.object({
    comment: z.string().min(1, "Comment is required").max(5000),
  }),
});
