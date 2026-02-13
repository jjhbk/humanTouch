import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSearchListings } from "./tools/search-listings.js";
import { registerGetListingDetails } from "./tools/get-listing-details.js";
import { registerRequestQuote } from "./tools/request-quote.js";
import { registerCreateOrder } from "./tools/create-order.js";
import { registerGetOrderStatus } from "./tools/get-order-status.js";
import { registerSubmitReview } from "./tools/submit-review.js";
import { registerCreateSmartAccount } from "./tools/create-smart-account.js";
import { registerGetSmartAccountBalance } from "./tools/get-smart-account-balance.js";
import { registerDepositEscrowFunds } from "./tools/deposit-escrow-funds.js";
import { registerReleasePayment } from "./tools/release-payment.js";

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

// Account Abstraction tools
registerCreateSmartAccount(server);
registerGetSmartAccountBalance(server);
registerDepositEscrowFunds(server);
registerReleasePayment(server);

export { server };
