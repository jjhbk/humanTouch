import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchListings } from "./tools/search-listings.js";
import { registerGetListingDetails } from "./tools/get-listing-details.js";
import { registerRequestQuote } from "./tools/request-quote.js";
import { registerCreateOrder } from "./tools/create-order.js";
import { registerGetOrderStatus } from "./tools/get-order-status.js";
import { registerSubmitReview } from "./tools/submit-review.js";

// Create default server instance for stdio mode
const server = new McpServer({
  name: "humanlayer",
  version: "0.1.0",
});

registerSearchListings(server);
registerGetListingDetails(server);
registerRequestQuote(server);
registerCreateOrder(server);
registerGetOrderStatus(server);
registerSubmitReview(server);

export { server };
