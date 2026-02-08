import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Review } from "@humanlayer/shared";
import { apiClient } from "../api-client.js";

export function registerSubmitReview(server: McpServer): void {
  server.tool(
    "submit_review",
    "Submit a review for a completed order. Rate the service from 1-5 and provide optional feedback.",
    {
      orderId: z.string().describe("The completed order ID"),
      rating: z
        .number()
        .int()
        .min(1)
        .max(5)
        .describe("Rating from 1 (poor) to 5 (excellent)"),
      comment: z.string().optional().describe("Written review"),
    },
    async (params) => {
      try {
        const result = await apiClient.post<Review>("/reviews", {
          orderId: params.orderId,
          rating: params.rating,
          comment: params.comment,
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error submitting review: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
