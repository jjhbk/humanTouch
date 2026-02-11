#!/bin/bash
# Prepare backend for standalone deployment
# This bundles the shared package into node_modules

set -e

echo "📦 Preparing backend for standalone deployment..."

# Build shared package
echo "Building @humanlayer/shared..."
cd ../shared
pnpm install
pnpm run build

# Copy shared dist to backend's node_modules
echo "Copying shared package to node_modules..."
cd ../backend
mkdir -p node_modules/@humanlayer/shared
cp -r ../shared/dist/* node_modules/@humanlayer/shared/
cp ../shared/package.json node_modules/@humanlayer/shared/

# Build backend
echo "Building backend..."
pnpm run build

echo "✅ Backend ready for deployment!"
echo "📁 Deploy the following:"
echo "   - dist/"
echo "   - node_modules/"
echo "   - package.json"
echo "   - prisma/"
echo "   - .env (configure for production)"
