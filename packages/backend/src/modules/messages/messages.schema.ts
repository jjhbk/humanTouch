import { z } from "zod";

export const sendMessageSchema = z.object({
  orderId: z.string().min(1),
  content: z.string().min(1).max(5000),
});

export const markAsReadSchema = z.object({
  messageIds: z.array(z.string()),
});
