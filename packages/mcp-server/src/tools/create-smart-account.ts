import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiClient } from "../api-client.js";

export function registerCreateSmartAccount(server: McpServer): void {
  server.tool(
    "create_smart_account",
    "Create or get your smart account for automated blockchain transactions. This is required before depositing escrow or releasing payments. Returns your smart account address and funding instructions.",
    {},
    async () => {
      try {
        const result = await apiClient.post("/smart-accounts", {});
        const data = result.data as any;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  smartAccountAddress: data.data.smartAccountAddress,
                  sessionKey: data.data.sessionKey,
                  needsFunding: data.data.needsFunding,
                  message: data.message,
                  instructions: data.data.needsFunding
                    ? {
                        step1: "Send USDC to your smart account address",
                        step2: "You can also send a small amount of ETH for gas (optional if using paymaster)",
                        note: "Once funded, you can execute transactions automatically",
                      }
                    : "Smart account is ready to use",
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error creating smart account: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
