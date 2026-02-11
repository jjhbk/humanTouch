#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "http";
import { randomUUID } from "crypto";

// Import the tool registration
import { registerSearchListings } from "./tools/search-listings.js";
import { registerGetListingDetails } from "./tools/get-listing-details.js";
import { registerRequestQuote } from "./tools/request-quote.js";
import { registerCreateOrder } from "./tools/create-order.js";
import { registerGetOrderStatus } from "./tools/get-order-status.js";
import { registerSubmitReview } from "./tools/submit-review.js";

const PORT = process.env.PORT || 3002;

// Create a single MCP server instance
const server = new McpServer({
  name: "humanlayer-mcp-server",
  version: "0.1.0",
});

// Register all tools once
registerSearchListings(server);
registerGetListingDetails(server);
registerRequestQuote(server);
registerCreateOrder(server);
registerGetOrderStatus(server);
registerSubmitReview(server);

// Create transport with session support
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => {
    return randomUUID();
  }
});

// Connect server to transport
await server.connect(transport);

// Create HTTP server using raw Node.js
const httpServer = createServer((req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url!, `http://${req.headers.host}`);

  // Health check endpoint
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "humanlayer-mcp-server" }));
    return;
  }

  // Root info endpoint
  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      name: "HumanLayer MCP Server",
      version: "0.1.0",
      description: "Model Context Protocol server for HumanLayer marketplace",
      transport: "StreamableHTTP",
      mcp_endpoint: "/mcp",
      health_check: "/health",
    }));
    return;
  }

  // MCP endpoint - delegate to transport
  if (url.pathname.startsWith("/mcp")) {
    console.log(`MCP request: ${req.method} ${url.pathname}`);
    try {
      transport.handleRequest(req, res);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
    return;
  }

  // 404 for other routes
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

httpServer.listen(PORT, () => {
  console.log(`HumanLayer MCP server listening on port ${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
