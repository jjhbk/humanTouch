#!/usr/bin/env node
/**
 * Quick test to verify MCP tools are registered
 */

const MCP_SERVER_URL = "http://localhost:3002/mcp";

async function testMCPTools() {
  console.log("🔍 Testing MCP Server Tools...\n");

  try {
    // MCP protocol: Initialize
    const initResponse = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "test-client",
            version: "1.0.0",
          },
        },
      }),
    });

    const initResult = await initResponse.json();
    console.log("✅ Initialize:", initResult.result?.serverInfo?.name || "OK");

    // MCP protocol: List tools
    const toolsResponse = await fetch(MCP_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      }),
    });

    const toolsResult = await toolsResponse.json();

    if (toolsResult.result?.tools) {
      console.log(`\n📋 Found ${toolsResult.result.tools.length} tools:\n`);

      const aaTools = [];
      const otherTools = [];

      toolsResult.result.tools.forEach((tool) => {
        if (
          tool.name.includes("smart_account") ||
          tool.name.includes("escrow") ||
          tool.name.includes("release_payment")
        ) {
          aaTools.push(tool);
        } else {
          otherTools.push(tool);
        }
      });

      console.log("🔷 Account Abstraction Tools:");
      aaTools.forEach((tool) => {
        console.log(`  ✓ ${tool.name}: ${tool.description}`);
      });

      console.log("\n🔶 Marketplace Tools:");
      otherTools.forEach((tool) => {
        console.log(`  ✓ ${tool.name}: ${tool.description}`);
      });

      console.log(`\n✅ Total: ${toolsResult.result.tools.length} tools registered`);
      console.log(`   - AA Tools: ${aaTools.length}`);
      console.log(`   - Marketplace Tools: ${otherTools.length}`);
    } else {
      console.error("❌ No tools found:", toolsResult);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testMCPTools();
