import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiClient } from "../api-client.js";

interface DepositResponse {
  message: string;
  data: {
    transactionHash: string;
    userOpHash: string;
    orderId: string;
    newStatus: string;
  };
}

export function registerDepositEscrowFunds(server: McpServer): void {
  server.tool(
    "deposit_escrow_funds",
    "Deposit USDC into escrow for an order via your smart account. This executes blockchain transactions automatically (approve USDC + deposit to escrow) in a single batched operation. Requires your smart account to have sufficient USDC balance. Changes order status from PENDING to CONFIRMED.",
    {
      orderId: z.string().describe("The order ID to deposit escrow for"),
      amount: z
        .string()
        .regex(/^\d+(\.\d{1,6})?$/, "Invalid USDC amount format")
        .describe("USDC amount to deposit (e.g., '100' or '100.50')"),
    },
    async (params) => {
      try {
        // First check balance
        let balanceCheck;
        try {
          const balanceResult = await apiClient.get("/smart-accounts/balance");
          const balanceData = balanceResult.data as any;
          const usdcBalance = BigInt(balanceData.data.balances.usdc);
          const requiredAmount = BigInt(Math.floor(parseFloat(params.amount) * 1e6));

          if (usdcBalance < requiredAmount) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(
                    {
                      error: "Insufficient USDC balance",
                      required: `${params.amount} USDC`,
                      available: `${(Number(usdcBalance) / 1e6).toFixed(2)} USDC`,
                      suggestion:
                        "Please fund your smart account with USDC before depositing escrow. Use get_smart_account_balance to see your address.",
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            };
          }
        } catch (balanceError) {
          // If balance check fails, continue anyway - backend will catch it
        }

        // Execute deposit
        const result = await apiClient.post<DepositResponse>(
          `/orders/${params.orderId}/deposit-escrow`,
          {
            amount: params.amount,
          }
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: "Escrow deposit successful! ✅",
                  transactionHash: result.data.data.transactionHash,
                  userOpHash: result.data.data.userOpHash,
                  orderId: result.data.data.orderId,
                  newStatus: result.data.data.newStatus,
                  amount: `${params.amount} USDC`,
                  blockExplorer: `https://sepolia.basescan.org/tx/${result.data.data.transactionHash}`,
                  note: "Order is now CONFIRMED. Provider can start working on it.",
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
                      "For now, use the manual escrow deposit flow via the frontend UI",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        if (message.includes("Daily limit exceeded")) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: "Daily spending limit exceeded",
                    message: message,
                    suggestion: "Please wait until tomorrow or contact support to increase your limit",
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        if (message.includes("Order must be PENDING")) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: "Invalid order status",
                    message: message,
                    suggestion:
                      "Check the order status using get_order_status tool. Escrow can only be deposited for PENDING orders.",
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
          content: [{ type: "text" as const, text: `Error depositing escrow: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
