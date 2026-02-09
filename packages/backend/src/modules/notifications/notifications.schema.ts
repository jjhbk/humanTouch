import { z } from "zod";

export const markAsReadSchema = z.object({
  body: z.object({
    notificationIds: z.array(z.string()).optional(),
    markAll: z.boolean().optional(),
  }).refine(
    (data) => data.notificationIds || data.markAll,
    { message: "Either notificationIds or markAll must be provided" }
  ),
});
