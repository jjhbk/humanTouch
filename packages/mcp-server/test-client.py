#!/usr/bin/env python3
"""
Test client for HumanLayer MCP server using Python
Requires: pip install mcp httpx
"""

import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import os

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://localhost:3002/sse")

async def main():
    print(f"🔌 Connecting to MCP server: {MCP_SERVER_URL}")

    # Note: Python MCP SDK currently supports stdio better than SSE
    # For HTTP/SSE, you may need to use httpx directly

    # Example with httpx:
    import httpx

    async with httpx.AsyncClient() as http_client:
        # Get server info
        response = await http_client.get(MCP_SERVER_URL.replace("/sse", "/"))
        print("📋 Server info:")
        print(response.json())

        print("\n✅ For full MCP protocol support, use the TypeScript test-client.ts")
        print("   or MCP Inspector (Node.js-based)")

if __name__ == "__main__":
    asyncio.run(main())
