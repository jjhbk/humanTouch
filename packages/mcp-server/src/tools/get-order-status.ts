import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Order, OrderStatusLog } from "@humanlayer/shared";
import { apiClient } from "../api-client.js";

interface OrderStatusResponse {
  order: Order;
  timeline?: OrderStatusLog[];
}

export function registerGetOrderStatus(server: McpServer): void {
  server.tool(
    "get_order_status",
    "Check the current status of an order including timeline, deliverables, and any updates.",
    {
      orderId: z.string().describe("The order ID or order number"),
    },
    async (params) => {
      try {
        const result = await apiClient.get<OrderStatusResponse>(
          `/orders/${params.orderId}`,
        );

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            { type: "text" as const, text: `Error fetching order status: ${message}` },
          ],
          isError: true,
        };
      }
    },
  );
}
