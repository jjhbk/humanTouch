# HumanLayer - End-to-End Testing Guide

Complete guide to test all functionality from setup to AI agent integration.

---

## Prerequisites

- Node.js 18+ and pnpm installed
- PostgreSQL database (local or Neon cloud)
- MetaMask or Coinbase Wallet browser extension
- Some Sepolia ETH and USDC for testing (get from faucets)

---

## Part 1: Initial Setup (5 minutes)

### 1. Clone and Install

```bash
cd /home/jjhbk/humantouch
pnpm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values:
nano .env
```

**Required env vars:**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/humanlayer"
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
JWT_SECRET="your-random-secret-here"
JWT_REFRESH_SECRET="your-other-random-secret"
```

### 3. Set Up Database

```bash
# Run migrations
pnpm db:migrate

# Verify connection
pnpm db:studio  # Opens Prisma Studio at http://localhost:5555
```

### 4. Deploy Smart Contracts (Base Sepolia)

```bash
# Compile contracts
pnpm contracts:compile

# Run tests (should show 49 passing)
pnpm contracts:test

# Deploy to Base Sepolia
# First, add your deployer private key to .env:
DEPLOYER_PRIVATE_KEY="your-private-key-here"

# Then deploy
pnpm contracts:deploy:sepolia
```

**Save the deployed contract addresses** and add them to `.env`:
```env
ESCROW_CONTRACT_ADDRESS="0x..."
STAKING_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS="0x..."
```

### 5. Start Dev Servers

```bash
# Terminal 1: Backend
pnpm --filter @humanlayer/backend run dev
# Runs on http://localhost:3001

# Terminal 2: Frontend
pnpm --filter @humanlayer/frontend run dev
# Runs on http://localhost:3000
```

✅ **Checkpoint:** Visit http://localhost:3000 - you should see the HumanLayer landing page.

---

## Part 2: Test Provider Flow (10 minutes)

### Test 2.1: Email Registration & Provider Onboarding

1. **Register as a Buyer**
   - Navigate to http://localhost:3000/register
   - Fill in: Name: "Test Provider", Email: "provider@test.com", Password: "testpass123"
   - Click "Register"
   - ✅ Should redirect to /listings and see "Browse" page

2. **Upgrade to Provider**
   - Click "Become a Provider" in the header navigation
   - Fill in provider profile:
     - Business Name: "Pro Design Studio"
     - Description: "Professional design services with 10 years experience"
     - Website: "https://example.com" (optional)
   - Click "Become a Provider"
   - ✅ Should redirect to /provider/dashboard

3. **Verify Provider Dashboard**
   - Check that URL is `/provider/dashboard`
   - ✅ Should see provider stats (0 listings, 0 orders initially)

### Test 2.2: Create a Service Listing

1. **Navigate to Create Listing**
   - From provider dashboard, click "Create Listing" or go to `/provider/listings/new`

2. **Fill Out Listing Form**
   - **Title:** "Professional Logo Design"
   - **Description:** "I'll create a modern, minimalist logo for your startup with 3 revisions included."
   - **Category:** Select "DESIGN"
   - **Pricing Model:** Select "FIXED"
   - **Base Price:** `350`
   - **Available Slots:** `5`
   - **Specifications** (guided form should appear based on category):
     - Design Type: "Logo"
     - Style: "Modern"
     - File Formats: Check "PNG", "SVG", "AI"
     - Revisions: `3`
     - Concept Variations: `3`
     - Turnaround Time: `7` days
   - **Tags:** `logo, design, branding, startup`

3. **Create Listing**
   - Click "Create Listing"
   - ✅ Should redirect to /provider/dashboard
   - ✅ Listing should appear in "My Listings"

### Test 2.3: Create API Key for AI Agents

1. **Navigate to Provider Settings**
   - Go to `/provider/settings`

2. **Create API Key**
   - Find "API Keys" section
   - Click "Create New API Key"
   - Label: "Claude AI Agent"
   - Permissions: Leave default
   - Click "Create"
   - ✅ **CRITICAL:** Copy the API key (shown only once!)
   - Format: `hl_live_abc123...`

3. **Save API Key**
   - Store in a safe place or add to `.env`:
   ```env
   HUMANLAYER_API_KEY="hl_live_..."
   ```

---

## Part 3: Test Buyer Flow (10 minutes)

### Test 3.1: Wallet Sign-In (SIWE)

1. **Open Incognito/Private Window**
   - Navigate to http://localhost:3000

2. **Connect Wallet**
   - Click "Connect Wallet" button in header
   - Select MetaMask or Coinbase Wallet
   - Connect your wallet
   - ✅ Should prompt you to sign a message
   - Click "Sign" in wallet

3. **Verify Authentication**
   - ✅ Header should show wallet address
   - ✅ Should be logged in as a buyer
   - Check: You should NOT see "Provider Dashboard" link (only buyers)

### Test 3.2: Discover Listings

1. **Browse Listings**
   - Go to `/listings` or click "Browse" in nav
   - ✅ Should see the "Professional Logo Design" listing you created

2. **Use Filters**
   - Category: Select "DESIGN"
   - Price Range: Max `500`
   - ✅ Listing should still appear

3. **View Listing Details**
   - Click on the listing
   - ✅ Should show full details including specifications

### Test 3.3: Request a Quote

1. **On Listing Detail Page**
   - Click "Request Quote" button
   - Fill out quote request form:
     - **Requirements** (structured based on listing specs):
       - Company Name: "TechFlow"
       - Industry: "SaaS"
       - Style Preference: "Modern, tech-focused"
       - Color Preferences: "Blue, White"
     - **Message:** "Need a logo for my new SaaS startup launching next month."
   - Click "Submit Quote Request"

2. **Verify Quote Created**
   - ✅ Should redirect to `/quotes`
   - ✅ Quote should show status "PENDING"

### Test 3.4: Provider Responds to Quote

1. **Switch Back to Provider Account**
   - Log out of buyer account
   - Sign in as `provider@test.com`

2. **View Quote Request**
   - Go to `/provider/quotes` or click notification
   - ✅ Should see pending quote from buyer

3. **Respond to Quote**
   - Click on the quote
   - Fill response:
     - **Quoted Price:** `350`
     - **Estimated Days:** `7`
     - **Provider Notes:** "Happy to help! Will include 3 logo concepts and unlimited revisions until you're satisfied."
   - Click "Send Quote"
   - ✅ Status should change to "RESPONDED"

### Test 3.5: Buyer Accepts Quote

1. **Switch to Buyer Account**
   - Log out, sign in with wallet again

2. **View Quote Response**
   - Go to `/quotes`
   - ✅ Should see quote with status "RESPONDED"
   - ✅ Should show provider's price ($350) and timeline

3. **Accept Quote**
   - Click "Accept Quote" button
   - ✅ Status changes to "ACCEPTED"

---

## Part 4: Test Order & Escrow Flow (15 minutes)

### Test 4.1: Create Order from Quote

1. **After Accepting Quote**
   - Click "Create Order" button
   - ✅ Order should be created with status "PENDING"
   - ✅ Should redirect to `/orders/[id]`

2. **View Order Details**
   - ✅ Order number format: `HL-2026-00001`
   - ✅ Amount: `350 USDC`
   - ✅ Status: "PENDING" (awaiting escrow deposit)

### Test 4.2: Get Test USDC on Base Sepolia

If you don't have Sepolia USDC:

```bash
# Option 1: Use Base Sepolia faucet
# Visit https://faucet.quicknode.com/base/sepolia

# Option 2: Mint from MockUSDC contract (if deployed)
# In Etherscan, call mint(your_address, 10000000000)
# (that's 10000 USDC with 6 decimals)
```

### Test 4.3: Deposit USDC to Escrow

1. **On Order Page**
   - ✅ Should see "Deposit Funds" section
   - ✅ Shows amount: 350 USDC
   - ✅ Shows escrow contract address

2. **Approve USDC Spending**
   - Click "Approve USDC" button
   - MetaMask popup appears
   - ✅ Transaction: Approve escrow contract to spend 350 USDC
   - Confirm in wallet
   - Wait for transaction confirmation (~2 seconds on Sepolia)

3. **Deposit to Escrow**
   - Click "Deposit to Escrow" button
   - MetaMask popup appears
   - ✅ Transaction: Transfer 350 USDC to escrow
   - Confirm in wallet
   - Wait for confirmation

4. **Backend Confirms Deposit**
   - Backend polls blockchain for deposit event
   - ✅ Order status should update to "CONFIRMED"
   - ✅ Should see transaction hash in order details

### Test 4.4: Provider Fulfills Order

1. **Switch to Provider Account**
   - Log in as provider@test.com

2. **View Active Order**
   - Go to `/provider/orders`
   - Click on the order
   - ✅ Status should be "CONFIRMED"

3. **Start Work**
   - Click "Start Work" button
   - ✅ Status changes to "IN_PROGRESS"

4. **Deliver Work**
   - Click "Mark as Delivered" button
   - Add deliverable links:
     - Upload logos to a file hosting service
     - Enter URLs or file names
   - Click "Submit Deliverables"
   - ✅ Status changes to "DELIVERED"

### Test 4.5: Buyer Completes Order & Releases Escrow

1. **Switch to Buyer Account**
   - Log in with wallet

2. **Review Deliverables**
   - Go to order page
   - ✅ Status: "DELIVERED"
   - ✅ Should see deliverable links
   - Download and review files

3. **Complete Order & Release Payment**
   - Click "Mark Complete & Release Payment" button
   - MetaMask popup for escrow.release() transaction
   - Confirm transaction
   - Wait for confirmation

4. **Verify Escrow Released**
   - ✅ Order status: "COMPLETED"
   - ✅ Provider receives 350 - (2.5% fee) = ~341.25 USDC
   - ✅ Platform owner receives ~8.75 USDC fee

### Test 4.6: Submit Review

1. **On Completed Order Page**
   - Click "Leave Review" button
   - Rating: 5 stars
   - Comment: "Amazing work! Logo is perfect for our brand. Quick turnaround and very professional."
   - Click "Submit Review"
   - ✅ Review should appear on listing detail page

---

## Part 5: Test MCP Server Integration with Claude (20 minutes)

### Test 5.1: Build and Configure MCP Server

1. **Build MCP Server**
   ```bash
   pnpm --filter @humanlayer/mcp-server run build
   ```

2. **Get API Key**
   - Use the API key created in Test 2.3
   - Or create a new one in provider settings

3. **Configure Claude Desktop**

   Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):
   ```json
   {
     "mcpServers": {
       "humanlayer": {
         "command": "node",
         "args": ["/home/jjhbk/humantouch/packages/mcp-server/dist/index.js"],
         "env": {
           "HUMANLAYER_API_URL": "http://localhost:3001/api/v1",
           "HUMANLAYER_API_KEY": "hl_live_YOUR_API_KEY_HERE"
         }
       }
     }
   }
   ```

4. **Restart Claude Desktop**
   - Quit and reopen Claude Desktop
   - ✅ MCP server should auto-start
   - ✅ Tools should appear in Claude's interface

### Test 5.2: AI Agent Searches for Services

In Claude Desktop, try this prompt:

```
Search the HumanLayer marketplace for logo design services under $400.
Show me the top 3 results.
```

✅ **Expected Response:**
- Claude uses `search_listings` tool
- Returns listings matching criteria
- Shows provider names, prices, ratings

### Test 5.3: AI Agent Gets Listing Details

```
Get me detailed information about the first listing, including the
provider's profile and past reviews.
```

✅ **Expected Response:**
- Claude uses `get_listing_details` tool
- Shows full specifications
- Shows provider info and reviews

### Test 5.4: AI Agent Requests a Quote

```
Request a quote for a logo design. I need a modern logo for "AI Helper",
a productivity AI tool. Budget is $350, need it in 5 days. Colors should
be purple and white.
```

✅ **Expected Response:**
- Claude uses `request_quote` tool
- Quote created with status PENDING
- Returns quote ID
- Stores structured requirements in database

### Test 5.5: Manual Provider Response

1. **Log in as Provider**
   - Go to `/provider/quotes`

2. **Respond to AI's Quote**
   - See quote from "AI Helper"
   - Respond with price and timeline

### Test 5.6: AI Agent Creates Order

After provider responds:

```
The provider responded with $350 for 7 days. That works for me.
Create an order and tell me how to pay.
```

✅ **Expected Response:**
- Claude uses `create_order` tool
- Order created with status PENDING
- Returns escrow deposit instructions
- Shows USDC amount and contract address

### Test 5.7: AI Agent Checks Order Status

After you deposit USDC:

```
Check the status of my order.
```

✅ **Expected Response:**
- Claude uses `get_order_status` tool
- Shows current status (CONFIRMED → IN_PROGRESS → DELIVERED)
- Shows timeline of status changes

### Test 5.8: AI Agent Submits Review

After order completion:

```
The logo looks great! Submit a 5-star review saying:
"Excellent work, exactly what I needed. Fast and professional."
```

✅ **Expected Response:**
- Claude uses `submit_review` tool
- Review posted successfully
- Updates provider's rating

---

## Part 6: Edge Case Testing

### Test 6.1: Disputed Order

1. Create an order, deposit funds
2. Provider delivers, but buyer is unsatisfied
3. Click "Dispute Order" button
4. ✅ Status: "DISPUTED"
5. Admin can refund via smart contract

### Test 6.2: Quote Expiry

1. Provider sets expiry date on quote response
2. Wait for expiry or manually advance time
3. ✅ Quote status automatically becomes "EXPIRED"
4. ✅ Buyer cannot accept expired quote

### Test 6.3: Invalid State Transitions

Try calling backend API directly:

```bash
# Try to mark order as COMPLETED without going through DELIVERED
curl -X PATCH http://localhost:3001/api/v1/orders/ORDER_ID/complete \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json"
```

✅ **Expected:** 400 error - "Invalid state transition"

---

## Part 7: Verification Checklist

Use this checklist to verify all features work:

- [ ] Email registration + JWT auth works
- [ ] Wallet (SIWE) authentication works
- [ ] Provider onboarding creates ProviderProfile
- [ ] Creating listings with guided specifications works
- [ ] Listings appear in search with correct filters
- [ ] Quote request/response workflow completes
- [ ] Order creation from accepted quote works
- [ ] USDC approve + deposit to escrow works
- [ ] Order status transitions follow state machine rules
- [ ] Escrow release sends funds to provider (minus fee)
- [ ] Review submission and display works
- [ ] MCP server connects to Claude Desktop
- [ ] All 6 MCP tools work correctly
- [ ] AI agent can complete full purchase flow
- [ ] Smart contracts deployed and verified on Basescan

---

## Common Issues & Solutions

### Issue: "DATABASE_URL not found"
**Solution:** Create symlink: `cd packages/backend && ln -s ../../.env .env`

### Issue: "404 on /auth/become-provider"
**Solution:** Check `NEXT_PUBLIC_API_URL` ends with `/api/v1` (not just `/api`)

### Issue: "indexedDB is not defined" during frontend build
**Solution:** This is expected (wagmi SSR issue), safe to ignore

### Issue: MCP tools not appearing in Claude Desktop
**Solution:**
1. Check claude_desktop_config.json syntax
2. Ensure MCP server built: `pnpm --filter @humanlayer/mcp-server run build`
3. Check logs: `tail -f ~/Library/Logs/Claude/mcp*.log`

### Issue: Escrow deposit fails
**Solution:**
1. Ensure you have Sepolia USDC
2. Check wallet is connected to Base Sepolia (Chain ID 84532)
3. Verify escrow contract address in .env matches deployment

---

## Performance Benchmarks

Expected timings on local development:

- Page load (frontend): <100ms
- API response time: <50ms
- Database query: <10ms
- Smart contract deploy: ~10 seconds
- Transaction confirmation: ~2 seconds (Sepolia)
- MCP tool call: <500ms

---

## Next Steps

After completing all tests:

1. **Deploy to Production**
   - Deploy contracts to Base Mainnet
   - Set up production database
   - Configure production env vars

2. **Set Up Monitoring**
   - Add error tracking (Sentry)
   - Add analytics (PostHog, Mixpanel)
   - Monitor blockchain events

3. **Scale Testing**
   - Load test with 100+ concurrent users
   - Test with multiple AI agents simultaneously

4. **Security Audit**
   - Smart contract audit
   - API security review
   - Penetration testing

---

**Testing Complete!** 🎉

You now have a fully functional AI-integrated marketplace where human providers can offer services and AI agents can autonomously discover, purchase, and review work.
