import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Order } from "@humanlayer/shared";
import { apiClient } from "../api-client.js";

export function registerCreateOrder(server: McpServer): void {
  server.tool(
    "create_order",
    "Create an order from an accepted quote. Returns order details and escrow deposit instructions.",
    {
      quoteId: z.string().describe("The accepted quote ID"),
    },
    async (params) => {
      try {
        const result = await apiClient.post<Order>("/orders", {
          quoteId: params.quoteId,
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error creating order: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
