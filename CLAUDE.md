# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HumanLayer is an AI-integrated marketplace connecting human services with AI automation. It's a **pnpm monorepo** with 5 packages that work together to enable:
- Human service listings (writing, design, development, etc.)
- Quote request/response workflow between buyers and providers
- USDC-based escrow on Base L2 (Coinbase's Layer 2)
- Order lifecycle with state machine enforcement
- MCP (Model Context Protocol) tools for AI agents to interact with the marketplace

**Key concept**: This is a two-sided marketplace where **buyers** request services, **providers** fulfill them, and smart contracts handle payments. AI agents can act as buyers via MCP tools.

## Architecture

### 1. Shared Package (`packages/shared/`)
Central source of truth for types, constants, and utilities used across all packages.

**Critical exports**:
- **State machines**: `ORDER_TRANSITIONS` and `QUOTE_TRANSITIONS` define valid status changes
  - Always use `isValidOrderTransition(from, to)` before changing order status
  - Orders: PENDING → CONFIRMED → IN_PROGRESS → DELIVERED → COMPLETED
  - Quotes: PENDING → RESPONDED → ACCEPTED (then becomes order)
- **Types**: All TypeScript interfaces (User, Listing, Quote, Order, Review, etc.)
- **Contract ABIs**: `packages/shared/src/contracts/` exports HumanLayerEscrow and HumanLayerStaking ABIs
- **USDC helpers**: `formatUSDC(bigint)` and `parseUSDC(string)` handle 6-decimal conversions

### 2. Backend (`packages/backend/`)
Express API with Prisma ORM. **All routes are under `/api/v1/`**.

**Authentication** (dual model):
- `Authorization: Bearer <jwt>` - For human users (email/password or SIWE wallet)
- `X-API-Key: hl_live_xxx` - For AI agents (SHA-256 hashed in DB)
- Both resolve to `req.user` with `{ id, role, authMethod }` via middleware

**Provider registration flow**:
- Users register as BUYER by default (via `/api/v1/auth/register` or wallet connect)
- Buyers upgrade to PROVIDER via `/api/v1/auth/become-provider` (requires auth)
- Upgrading creates a ProviderProfile and changes user role to PROVIDER
- Frontend: `/become-provider` page for provider onboarding

**Module structure**: Each domain has its own folder under `src/modules/`:
```
{domain}/
  {domain}.routes.ts    - Express router with endpoints
  {domain}.controller.ts - Request/response handling
  {domain}.service.ts    - Business logic (no req/res, testable)
  {domain}.schema.ts     - Zod validation schemas
```

**Order state enforcement**: The orders service **must** validate transitions using `isValidOrderTransition()` from `@humanlayer/shared` before updating status. Every transition creates an `OrderStatusLog` entry for audit trail.

**Prisma models** (10 total):
- `User` - Can be BUYER, PROVIDER, or ADMIN; supports email OR wallet auth
- `ProviderProfile` - 1:1 with User, has stakeAmount, averageRating, verificationStatus
- `Listing` - Has `specifications` JSON field (machine-readable for AI agents)
- `Quote` - Request/response workflow with `requirements` JSON field
- `Order` - Links to Quote, tracks escrow via `escrowTxHash` and `escrowId`
- `OrderStatusLog` - Immutable audit trail of status changes
- `Transaction` - On-chain transaction records (ESCROW_DEPOSIT, ESCROW_RELEASE, etc.)
- `Review` - 1-5 rating, only for COMPLETED orders
- `RefreshToken` - JWT refresh token rotation
- `ApiKey` - Hashed API keys for AI agents

### 3. Smart Contracts (`packages/contracts/`)
Solidity 0.8.20 contracts deployed on **Base L2** (Coinbase's Layer 2).

**HumanLayerEscrow.sol**:
- USDC-based escrow (uses Base Sepolia USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`)
- Platform takes 2.5% fee (250 basis points, configurable by owner)
- Buyer deposits → Provider releases (or auto-release after deadline) → Platform gets fee
- Admin can refund disputed orders
- Uses OpenZeppelin: ReentrancyGuard, SafeERC20, Ownable, Pausable

**HumanLayerStaking.sol**:
- Providers stake USDC to become active
- Cooldown period (7 days default) before unstaking
- Admin can slash stake for misconduct

**Deployment flow**:
1. Compile: `pnpm contracts:compile`
2. Test: `pnpm contracts:test` (49 tests must pass)
3. Deploy to Sepolia: `pnpm contracts:deploy:sepolia`
4. Update `.env` with contract addresses
5. ABIs are auto-exported to `packages/shared/src/contracts/`

### 4. Frontend (`packages/frontend/`)
Next.js 14 App Router with **route groups** for layout organization.

**Route structure**:
- `(auth)/login`, `register` - Auth pages with centered layout
- `become-provider` - Provider registration/upgrade page for buyers
- `(marketplace)/listings`, `quotes`, `orders/[id]` - Buyer flows
- `provider/dashboard`, `listings`, `quotes`, `orders`, `settings` - Provider portal (uses real `/provider/` URL prefix)

**Note**: Route groups `(auth)` and `(marketplace)` are layout-only (parentheses mean they don't appear in URLs). Provider routes intentionally use `provider/` without parentheses to avoid Next.js dynamic route collisions.

**Web3 integration**:
- wagmi + RainbowKit for wallet connection (MetaMask, Coinbase Wallet, WalletConnect)
- SIWE (Sign-In With Ethereum) for wallet authentication
- `useEscrowDeposit` hook handles two-step flow: approve USDC → deposit to escrow contract

**State management**:
- Zustand for auth state (`lib/auth.ts`)
- React Hook Form + Zod for forms
- API calls via `lib/api.ts` (automatically adds auth headers)

**Expected build warnings** (safe to ignore):
- `indexedDB is not defined` - wagmi trying to access browser APIs during SSR
- MetaMask SDK warnings about react-native-async-storage
- pino-pretty warnings from WalletConnect

### 5. MCP Server (`packages/mcp-server/`)
Model Context Protocol server exposing 6 tools for AI agents to interact with the marketplace.

**Tools**:
- `search_listings` - Filter by category, price, rating, tags, full-text search
- `get_listing_details` - Full listing with specs, provider profile, reviews
- `request_quote` - Submit structured requirements JSON
- `create_order` - Create from accepted quote, get escrow instructions
- `get_order_status` - Check status, timeline, deliverables
- `submit_review` - Rate 1-5 after order completion

**Authentication**: Uses X-API-Key header to authenticate with backend. API keys must be created via `/api/v1/auth/api-keys` endpoint first.

## Development Commands

### Initial Setup
```bash
pnpm install                  # Install all dependencies
cp .env.example .env          # Create environment file (fill in values)
pnpm db:migrate               # Run Prisma migrations
pnpm contracts:compile        # Compile Solidity contracts
```

### Development
```bash
pnpm dev                      # Start all packages in watch mode (excludes contracts)
pnpm db:studio                # Open Prisma Studio (database GUI)
```

### Individual Package Development
```bash
pnpm --filter @humanlayer/backend run dev      # Backend only (port 3001)
pnpm --filter @humanlayer/frontend run dev     # Frontend only (port 3000)
pnpm --filter @humanlayer/mcp-server run dev   # MCP server only
```

### Database Operations
```bash
pnpm db:generate              # Generate Prisma Client after schema changes
pnpm db:migrate               # Create and run new migration
pnpm db:push                  # Push schema changes without migration (dev only)
pnpm db:seed                  # Run seed script
```

### Smart Contracts
```bash
pnpm contracts:compile        # Compile Solidity contracts
pnpm contracts:test           # Run Hardhat tests (49 tests)
pnpm contracts:deploy:sepolia # Deploy to Base Sepolia testnet
pnpm contracts:deploy:mainnet # Deploy to Base mainnet (production)
```

### Testing & Building
```bash
pnpm test                     # Run all tests across packages
pnpm build                    # Build all packages
pnpm lint                     # TypeScript type-check all packages
```

### Cleanup
```bash
pnpm clean                    # Remove all build artifacts, node_modules, caches
```

## Critical Invariants

1. **Order state transitions MUST use `isValidOrderTransition()`** from `@humanlayer/shared`. The backend service enforces this, but any direct DB updates must respect it.

2. **USDC amounts are Decimal(18,6) in DB, but 6 decimals on-chain**. Always use `parseUSDC()` before sending to contracts and `formatUSDC()` after reading.

3. **JWT tokens expire in 15 minutes**. Refresh tokens last 7 days. Frontend must handle refresh flow or users will be logged out.

4. **API keys are hashed with SHA-256** before storage. Raw keys are shown only once at creation time. Prefix is `hl_live_` for easy identification.

5. **Listings have machine-readable `specifications` JSON**. Structure varies by category. AI agents parse this to understand service requirements.

6. **Quotes must be ACCEPTED before creating an order**. Orders link to quotes, which link to listings. This chain is immutable.

7. **Reviews are 1:1 with orders** (unique constraint on `orderId`). Can only review COMPLETED orders. Provider can reply to reviews but not edit them.

8. **Next.js route groups**: `(auth)` and `(marketplace)` don't appear in URLs. Provider routes use `provider/` (no parentheses) to avoid `/[slug]` collisions.

## Environment Variables

See `.env.example` for full list. Critical ones:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` - For token signing (change in production!)
- `BASE_RPC_URL` - Base Sepolia: `https://sepolia.base.org` (testnet) or `https://mainnet.base.org` (production)
- `USDC_ADDRESS` - Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- `ESCROW_CONTRACT_ADDRESS` / `STAKING_CONTRACT_ADDRESS` - Filled after deployment
- `NEXT_PUBLIC_*` - Frontend needs `NEXT_PUBLIC_` prefix for client-side access
- `DEPLOYER_PRIVATE_KEY` - Required for contract deployment (NEVER commit!)

## Package Dependencies

When adding imports:
- Backend/MCP server can import from `@humanlayer/shared`
- Frontend can import from `@humanlayer/shared` (transpiled via `next.config.js`)
- Contracts package is standalone (no shared imports)
- Shared package has no dependencies on other packages

## Blockchain Specifics

**Base L2 (Coinbase)**:
- Sepolia testnet: Chain ID 84532
- Mainnet: Chain ID 8453
- USDC is native on Base (6 decimals)
- Lower gas fees than Ethereum mainnet
- Block explorer: basescan.org (mainnet) or sepolia.basescan.org (testnet)

**Escrow flow**:
1. Buyer creates order (status: PENDING)
2. Buyer approves USDC spending for escrow contract
3. Buyer calls `escrow.deposit(provider, orderId, amount, deadline)`
4. Backend confirms tx, updates order (status: CONFIRMED), stores `escrowTxHash`
5. Provider delivers work (status: DELIVERED)
6. Buyer releases payment via `escrow.release(escrowId)` OR auto-release after deadline
7. Escrow sends (amount - fee) to provider, fee to platform owner
