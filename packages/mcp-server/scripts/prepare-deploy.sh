#!/bin/bash
# Prepare mcp-server for standalone deployment

set -e

echo "📦 Preparing mcp-server for standalone deployment..."

# Build shared package
echo "Building @humanlayer/shared..."
cd ../shared
pnpm install
pnpm run build

# Copy shared dist to mcp-server's node_modules
echo "Copying shared package to node_modules..."
cd ../mcp-server
mkdir -p node_modules/@humanlayer/shared
cp -r ../shared/dist/* node_modules/@humanlayer/shared/
cp ../shared/package.json node_modules/@humanlayer/shared/

# Build mcp-server
echo "Building mcp-server..."
pnpm run build

echo "✅ MCP server ready for deployment!"
echo "📁 Deploy the following:"
echo "   - dist/"
echo "   - node_modules/"
echo "   - package.json"
echo "   - .env (configure for production)"
