# Enabling Live Transactions with Biconomy

## Overview

Currently, the AA system has a stub implementation that validates everything but returns "Not Implemented" for actual blockchain transactions. This guide shows you how to replace the stub with real Biconomy SDK integration.

---

## Step 1: Get Biconomy API Keys

### 1.1 Sign Up for Biconomy Dashboard

1. Go to https://dashboard.biconomy.io/
2. Sign up or log in with GitHub/Google
3. Create a new project

### 1.2 Configure for Base Sepolia

1. In dashboard, select **"Create New Project"**
2. Project Settings:
   - **Name**: HumanLayer Marketplace
   - **Network**: Base Sepolia (84532)
   - **Type**: Smart Account

### 1.3 Get Your API Keys

You'll need two keys:

#### Bundler URL:
```
https://bundler.biconomy.io/api/v2/84532/YOUR_BUNDLER_KEY
```

#### Paymaster API Key:
```
YOUR_PAYMASTER_API_KEY
```

### 1.4 Update .env

```bash
# In /home/jjhbk/humantouch/.env
BICONOMY_BUNDLER_URL="https://bundler.biconomy.io/api/v2/84532/YOUR_BUNDLER_KEY"
BICONOMY_PAYMASTER_URL="https://paymaster.biconomy.io/api/v1/84532/YOUR_PAYMASTER_API_KEY"
```

---

## Step 2: Implement Biconomy SDK Integration

The stub implementation at `packages/backend/src/services/smart-account.service.ts` needs to be replaced with real Biconomy calls.

### 2.1 Check Biconomy SDK Version

First, verify the SDK version:

```bash
cd packages/backend
pnpm list @biconomy/account
```

Expected: `@biconomy/account 4.5.7`

### 2.2 Implementation Approach

We have two options:

#### Option A: Use the Prepared Implementation (Recommended)

The file `smart-account.service.ts.bak` contains the full Biconomy implementation. We just need to fix the imports.

#### Option B: Implement from Scratch

Follow Biconomy's documentation to build it step by step.

---

## Step 3: Fix the Biconomy Implementation

### 3.1 Check Biconomy v4 API

The Biconomy v4 SDK has different exports than v2. Let's verify the correct imports:

```typescript
// Check what's actually exported
import * as BiconomySDK from "@biconomy/account";
console.log(Object.keys(BiconomySDK));
```

### 3.2 Correct Implementation Pattern

Based on Biconomy v4 docs, here's the correct pattern:

```typescript
import { createSmartAccountClient, BiconomySmartAccountV2 } from "@biconomy/account";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

// Create the signer (session key account)
const sessionPrivateKey = "0x...";
const sessionAccount = privateKeyToAccount(sessionPrivateKey);

// Create smart account client
const smartAccount = await createSmartAccountClient({
  signer: sessionAccount,
  bundlerUrl: process.env.BICONOMY_BUNDLER_URL!,
  biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_API_KEY,
  rpcUrl: process.env.BASE_RPC_URL!,
});

// Get the smart account address
const address = await smartAccount.getAccountAddress();

// Send a transaction
const userOpResponse = await smartAccount.sendTransaction({
  to: "0x...",
  data: "0x...",
  value: 0n,
});

// Wait for confirmation
const { transactionHash } = await userOpResponse.waitForTxHash();
const receipt = await userOpResponse.wait();
```

### 3.3 Key Differences from Stub

The stub implementation has:
- ❌ `buildSmartAccount()` - Not actually calling Biconomy SDK
- ❌ `executeEscrowDeposit()` - Throws "Not Implemented"
- ❌ `executeEscrowRelease()` - Throws "Not Implemented"

The real implementation needs:
- ✅ Actually create Biconomy smart account client
- ✅ Encode transaction data correctly
- ✅ Send user operations
- ✅ Wait for blockchain confirmation

---

## Step 4: Updated Implementation

Let me create the corrected implementation:

### File: `packages/backend/src/services/smart-account.service.ts`

**Key Changes Needed:**

1. **Import Biconomy v4 SDK correctly**:
   - Check package exports
   - Use dynamic imports if needed
   - Add type assertions for TypeScript

2. **Implement `buildSmartAccount()`**:
   ```typescript
   private async buildSmartAccount(sessionPrivateKey: Hex) {
     const sessionAccount = privateKeyToAccount(sessionPrivateKey);

     const smartAccount = await createSmartAccountClient({
       signer: sessionAccount,
       bundlerUrl: this.bundlerUrl,
       biconomyPaymasterApiKey: this.paymasterApiKey,
       rpcUrl: process.env.BASE_RPC_URL!,
     });

     return smartAccount;
   }
   ```

3. **Implement `executeEscrowDeposit()`**:
   ```typescript
   async executeEscrowDeposit(apiKeyId, orderId, provider, amount, deadline) {
     // Get and decrypt session key
     const sessionKey = await prisma.sessionKey.findUnique({
       where: { apiKeyId },
       include: { smartAccount: true },
     });

     const privateKey = await keyManagementService.decryptSessionKey(
       sessionKey.encryptedPrivateKey
     );

     // Build smart account
     const smartAccount = await this.buildSmartAccount(privateKey);

     // Encode approve + deposit transactions
     const approveData = encodeFunctionData({
       abi: ERC20_ABI,
       functionName: "approve",
       args: [ESCROW_CONTRACT_ADDRESS, parseUSDC(amount)],
     });

     const depositData = encodeFunctionData({
       abi: HumanLayerEscrowABI,
       functionName: "deposit",
       args: [provider, orderId, parseUSDC(amount), BigInt(deadline)],
     });

     // Send batched transaction
     const userOpResponse = await smartAccount.sendTransaction([
       { to: USDC_ADDRESS, data: approveData, value: 0n },
       { to: ESCROW_CONTRACT_ADDRESS, data: depositData, value: 0n },
     ]);

     // Wait for confirmation
     const { transactionHash } = await userOpResponse.waitForTxHash();
     const receipt = await userOpResponse.wait();

     return {
       transactionHash,
       userOpHash: userOpResponse.userOpHash,
       receipt,
     };
   }
   ```

4. **Implement `executeEscrowRelease()`**: Similar pattern

---

## Step 5: Testing Strategy

### 5.1 Unit Tests (Local)

First, test without blockchain:

```bash
cd packages/backend
pnpm test src/services/__tests__/smart-account.service.test.ts
```

### 5.2 Integration Tests (Base Sepolia)

Test with real blockchain:

#### Prerequisites:
1. ✅ Biconomy API keys configured
2. ✅ Base Sepolia RPC URL
3. ✅ Test USDC (from faucet)
4. ✅ Test order created

#### Test Flow:
```bash
# 1. Start backend
pnpm run dev

# 2. Create smart account via API
curl -X POST http://localhost:3001/api/v1/smart-accounts \
  -H "X-API-Key: hl_live_YOUR_KEY"

# Response should include smart account address

# 3. Fund the smart account
# Send Sepolia USDC to the address from step 2
# Get USDC from: https://faucet.circle.com/

# 4. Verify balance
curl http://localhost:3001/api/v1/smart-accounts/balance \
  -H "X-API-Key: hl_live_YOUR_KEY"

# 5. Create an order (PENDING status)
# Use the frontend or API

# 6. Deposit escrow (THIS IS THE LIVE TRANSACTION!)
curl -X POST http://localhost:3001/api/v1/orders/ORDER_ID/deposit-escrow \
  -H "X-API-Key: hl_live_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": "10"}'

# 7. Verify on Basescan
# Check the returned txHash on https://sepolia.basescan.org/
```

---

## Step 6: Common Issues & Solutions

### Issue 1: "Cannot find module @biconomy/account"

**Cause**: ESM/CommonJS mismatch

**Solution**:
```typescript
// Use dynamic import
const { createSmartAccountClient } = await import("@biconomy/account");
```

### Issue 2: "Invalid Bundler URL"

**Cause**: Wrong URL format or missing API key

**Solution**: Check Biconomy dashboard for correct URL format

### Issue 3: "Insufficient funds for gas"

**Cause**: Smart account has no ETH for gas

**Solution**:
- Option A: Use paymaster (gas sponsorship) ✅ Recommended
- Option B: Send small amount of ETH to smart account

### Issue 4: "Session key not authorized"

**Cause**: Session key permissions not set correctly

**Solution**: Verify session key setup in Biconomy dashboard

---

## Step 7: Enable Gas Sponsorship (Paymaster)

### 7.1 Configure Paymaster in Biconomy Dashboard

1. Go to **Paymaster** section
2. Enable gas sponsorship
3. Set spending limits (optional)
4. Get Paymaster API key

### 7.2 Update Smart Account Creation

```typescript
const smartAccount = await createSmartAccountClient({
  signer: sessionAccount,
  bundlerUrl: this.bundlerUrl,
  biconomyPaymasterApiKey: this.paymasterApiKey, // This enables gas sponsorship
  rpcUrl: process.env.BASE_RPC_URL!,
});
```

With this enabled, users **don't need ETH** - Biconomy pays the gas!

---

## Step 8: Production Checklist

Before deploying to production:

- [ ] Test on Base Sepolia thoroughly
- [ ] Verify all error scenarios work correctly
- [ ] Test session key expiry
- [ ] Test permission enforcement
- [ ] Test daily limits
- [ ] Monitor gas costs with paymaster
- [ ] Set up alerting for failed transactions
- [ ] Document the flow for users
- [ ] Update API keys to production (Base mainnet)
- [ ] Test with small amounts first
- [ ] Have rollback plan ready

---

## Alternative: Quick Test Without Full Implementation

If you just want to verify Biconomy SDK works:

### Create Test Script

```typescript
// packages/backend/src/scripts/test-biconomy.ts
import { createSmartAccountClient } from "@biconomy/account";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

async function testBiconomy() {
  // Use a test private key
  const testAccount = privateKeyToAccount("0xTEST_PRIVATE_KEY");

  const smartAccount = await createSmartAccountClient({
    signer: testAccount,
    bundlerUrl: process.env.BICONOMY_BUNDLER_URL!,
    biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_API_KEY,
    rpcUrl: process.env.BASE_RPC_URL!,
  });

  console.log("Smart Account Address:", await smartAccount.getAccountAddress());
  console.log("✅ Biconomy SDK working!");
}

testBiconomy();
```

Run:
```bash
tsx src/scripts/test-biconomy.ts
```

---

## Summary

**To enable live transactions:**

1. ✅ Get Biconomy API keys (5 min)
2. ✅ Update .env with keys (1 min)
3. 🔧 Fix SDK imports in smart-account.service.ts (30 min)
4. 🔧 Implement buildSmartAccount() (15 min)
5. 🔧 Implement executeEscrowDeposit() (30 min)
6. 🔧 Implement executeEscrowRelease() (15 min)
7. 🧪 Test on Base Sepolia (30 min)
8. 🚀 Deploy to production

**Total time**: ~2-3 hours

**The architecture is ready** - you just need to swap out the stub with real Biconomy SDK calls!
