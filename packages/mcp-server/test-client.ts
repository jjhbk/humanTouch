#!/usr/bin/env node
/**
 * Test client for HumanLayer MCP server
 * Usage: tsx test-client.ts
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "http://localhost:3002/sse";

async function main() {
  console.log(`🔌 Connecting to MCP server: ${MCP_SERVER_URL}`);

  const transport = new SSEClientTransport(new URL(MCP_SERVER_URL));

  const client = new Client(
    {
      name: "humanlayer-test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("✅ Connected to MCP server\n");

  // List available tools
  const tools = await client.listTools();
  console.log("📋 Available tools:");
  tools.tools.forEach((tool) => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });
  console.log();

  // Example: Search for listings
  console.log("🔍 Testing search_listings tool...");
  try {
    const result = await client.callTool({
      name: "search_listings",
      arguments: {
        category: "WRITING",
        limit: 3,
      },
    });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("Error:", error.message);
  }

  await client.close();
  console.log("\n👋 Disconnected");
}

main().catch(console.error);
