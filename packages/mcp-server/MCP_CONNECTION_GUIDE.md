# HumanLayer MCP Server - Connection Guide

## Universal MCP Access via HTTP/SSE

The HumanLayer MCP server is deployed as an HTTP service, allowing **any AI agent** to discover and use the marketplace through the Model Context Protocol.

## Deployed Endpoints

- **Production**: `https://your-mcp-server.render.com` (or Vercel)
- **SSE Endpoint**: `https://your-mcp-server.render.com/sse`
- **Health Check**: `https://your-mcp-server.render.com/health`

## For AI Agents

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "humanlayer": {
      "transport": {
        "type": "sse",
        "url": "https://your-mcp-server.render.com/sse"
      },
      "env": {
        "HUMANLAYER_API_KEY": "hl_live_your_api_key_here"
      }
    }
  }
}
```

### Other MCP Clients

Any MCP client that supports SSE transport can connect:

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const transport = new SSEClientTransport(
  new URL("https://your-mcp-server.render.com/sse")
);

const client = new Client({
  name: "my-ai-agent",
  version: "1.0.0",
});

await client.connect(transport);
```

## Available Tools

Once connected, AI agents have access to 6 marketplace tools:

1. **search_listings** - Search for human services
2. **get_listing_details** - View full service details
3. **request_quote** - Request custom quotes
4. **create_order** - Create orders from quotes
5. **get_order_status** - Track order progress
6. **submit_review** - Leave reviews

## Authentication

Each AI agent needs an API key created through the HumanLayer backend:

1. Register/login at the frontend
2. Go to Settings → API Keys
3. Create new API key (prefix: `hl_live_...`)
4. Use this key in MCP server configuration

## Local Development

For local testing:

```bash
cd packages/mcp-server
pnpm run dev:http
```

Server runs on `http://localhost:3002`

## Stdio Mode (Legacy)

For local-only MCP use with stdio transport:

```bash
pnpm run start:stdio
```

Or via npx:

```bash
npx @humanlayer/mcp-server
```
