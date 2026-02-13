import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiClient } from "../api-client.js";

interface ReleaseResponse {
  message: string;
  data: {
    transactionHash: string;
    userOpHash: string;
    orderId: string;
    newStatus: string;
  };
}

export function registerReleasePayment(server: McpServer): void {
  server.tool(
    "release_payment",
    "Release escrow payment to the provider via your smart account. This executes the blockchain transaction automatically to release funds from escrow. Should be called after provider delivers the work. Changes order status to COMPLETED.",
    {
      orderId: z.string().describe("The order ID to release payment for"),
    },
    async (params) => {
      try {
        // Execute release
        const result = await apiClient.post<ReleaseResponse>(
          `/orders/${params.orderId}/release-payment`,
          {}
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: "Payment released successfully! ✅",
                  transactionHash: result.data.data.transactionHash,
                  userOpHash: result.data.data.userOpHash,
                  orderId: result.data.data.orderId,
                  newStatus: result.data.data.newStatus,
                  blockExplorer: `https://sepolia.basescan.org/tx/${result.data.data.transactionHash}`,
                  note: "Order is now COMPLETED. Provider has received payment. You can now submit a review.",
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";

        // Provide helpful error messages
        if (message.includes("Smart account not found")) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: "Smart account not found",
                    suggestion:
                      "Please create a smart account first using the create_smart_account tool",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        if (message.includes("Not implemented")) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: "Account Abstraction integration pending",
                    message:
                      "Smart account transactions are not yet fully implemented. This feature requires Biconomy SDK integration (Task #7).",
                    currentStatus: "You can still create smart accounts and check balances",
                    workaround:
                      "For now, use the manual escrow release flow via the frontend UI",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        if (message.includes("Order cannot be released")) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: "Invalid order status",
                    message: message,
                    suggestion:
                      "Check the order status using get_order_status tool. Payment can only be released for DELIVERED, IN_PROGRESS, or CONFIRMED orders.",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        if (message.includes("Escrow ID not found")) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: "Escrow not deposited",
                    message: "No escrow deposit found for this order",
                    suggestion:
                      "Make sure you deposited escrow first using the deposit_escrow_funds tool",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        if (message.includes("You are not the buyer")) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: "Unauthorized",
                    message: "Only the buyer can release payment for this order",
                    suggestion: "Make sure you're using the correct API key for the buyer account",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [{ type: "text" as const, text: `Error releasing payment: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
