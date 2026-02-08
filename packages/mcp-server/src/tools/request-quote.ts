import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Quote } from "@humanlayer/shared";
import { apiClient } from "../api-client.js";

export function registerRequestQuote(server: McpServer): void {
  server.tool(
    "request_quote",
    "Request a quote from a service provider. Provide your requirements and they will respond with pricing and timeline.",
    {
      listingId: z.string().describe("The listing to request a quote for"),
      requirements: z
        .record(z.unknown())
        .describe("Structured requirements (varies by service type)"),
      message: z.string().optional().describe("Additional message to the provider"),
    },
    async (params) => {
      try {
        const result = await apiClient.post<Quote>("/quotes", {
          listingId: params.listingId,
          requirements: params.requirements,
          message: params.message,
        });

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error requesting quote: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
