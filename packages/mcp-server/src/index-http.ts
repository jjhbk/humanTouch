#!/usr/bin/env node

import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { server } from "./server.js";
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS for all origins (AI agents can connect from anywhere)
app.use(cors());
app.use(express.json());

// Health check endpoint for Render
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "humanlayer-mcp-server" });
});

// SSE endpoint for MCP protocol
app.get("/sse", async (req, res) => {
  console.log("New MCP client connection via SSE");

  const transport = new SSEServerTransport("/message", res);
  await server.connect(transport);

  // Keep connection alive
  req.on("close", () => {
    console.log("Client disconnected");
  });
});

// POST endpoint for MCP messages
app.post("/message", async (req, res) => {
  // SSE transport handles this internally
  res.status(200).end();
});

// Root endpoint with info
app.get("/", (_req, res) => {
  res.json({
    name: "HumanLayer MCP Server",
    version: "0.1.0",
    description: "Model Context Protocol server for HumanLayer marketplace",
    mcp_endpoint: "/sse",
    health_check: "/health",
    documentation: "https://github.com/yourusername/humanlayer",
  });
});

app.listen(PORT, () => {
  console.log(`HumanLayer MCP server listening on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
