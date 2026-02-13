import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiClient } from "../api-client.js";

interface BalanceResponse {
  data: {
    address: string;
    balances: {
      usdc: string;
      eth: string;
    };
  };
}

export function registerGetSmartAccountBalance(server: McpServer): void {
  server.tool(
    "get_smart_account_balance",
    "Check your smart account balance. Returns USDC balance (for escrow) and ETH balance (for gas). This helps verify you have sufficient funds before making transactions.",
    {},
    async () => {
      try {
        const result = await apiClient.get<BalanceResponse>("/smart-accounts/balance");

        const usdcRaw = BigInt(result.data.data.balances.usdc);
        const ethRaw = BigInt(result.data.data.balances.eth);

        // Convert to human-readable format
        const usdcFormatted = (Number(usdcRaw) / 1e6).toFixed(2); // USDC has 6 decimals
        const ethFormatted = (Number(ethRaw) / 1e18).toFixed(4); // ETH has 18 decimals

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  address: result.data.data.address,
                  balances: {
                    usdc: `${usdcFormatted} USDC`,
                    eth: `${ethFormatted} ETH`,
                  },
                  raw: {
                    usdc: result.data.data.balances.usdc,
                    eth: result.data.data.balances.eth,
                  },
                  status:
                    Number(usdcRaw) > 0
                      ? "✅ Funded - Ready for transactions"
                      : "⚠️ No USDC - Please fund your smart account before making transactions",
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
                    suggestion: "Please create a smart account first using the create_smart_account tool",
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
          content: [
            { type: "text" as const, text: `Error fetching balance: ${message}` },
          ],
          isError: true,
        };
      }
    }
  );
}
