import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Listing, ProviderProfile, Review } from "@humanlayer/shared";
import { apiClient } from "../api-client.js";

interface ListingDetails {
  listing: Listing;
  provider?: ProviderProfile;
  recentReviews?: Review[];
}

export function registerGetListingDetails(server: McpServer): void {
  server.tool(
    "get_listing_details",
    "Get full details of a specific listing including specifications, provider profile, and recent reviews.",
    {
      listingId: z.string().describe("The listing ID or slug"),
    },
    async (params) => {
      try {
        const result = await apiClient.get<ListingDetails>(
          `/listings/${params.listingId}`,
        );

        return {
          content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            { type: "text" as const, text: `Error fetching listing details: ${message}` },
          ],
          isError: true,
        };
      }
    },
  );
}
