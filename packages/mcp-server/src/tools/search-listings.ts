import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { LISTING_CATEGORIES, type Listing, type PaginationMeta } from "@humanlayer/shared";
import { apiClient } from "../api-client.js";

export function registerSearchListings(server: McpServer): void {
  server.tool(
    "search_listings",
    "Search the HumanLayer marketplace for human service listings. Filter by category, price range, minimum rating, tags, and text search.",
    {
      category: z.enum(LISTING_CATEGORIES).optional().describe("Filter by service category"),
      minPrice: z.number().optional().describe("Minimum price in USDC"),
      maxPrice: z.number().optional().describe("Maximum price in USDC"),
      minRating: z.number().min(1).max(5).optional().describe("Minimum provider rating"),
      tags: z.array(z.string()).optional().describe("Filter by tags"),
      search: z.string().optional().describe("Full-text search on title and description"),
      page: z.number().default(1).describe("Page number"),
      limit: z.number().default(20).describe("Results per page"),
      sortBy: z
        .enum(["price_asc", "price_desc", "rating", "newest"])
        .optional()
        .describe("Sort order for results"),
    },
    async (params) => {
      try {
        const result = await apiClient.get<Listing[]>("/listings", {
          category: params.category,
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
          minRating: params.minRating,
          tags: params.tags,
          search: params.search,
          page: params.page,
          limit: params.limit,
          sortBy: params.sortBy,
        });

        const response: { listings: Listing[]; pagination?: PaginationMeta } = {
          listings: result.data,
        };
        if (result.meta) {
          response.pagination = result.meta;
        }

        return {
          content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: `Error searching listings: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
