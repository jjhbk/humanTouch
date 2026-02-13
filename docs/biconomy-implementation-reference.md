# Biconomy Implementation Reference

## Quick Start: Replace Stub with Live Implementation

### Current Status
✅ Architecture complete
✅ Types defined
✅ Validation working
⚠️ Transactions stubbed (throw "Not Implemented")

### What Needs Changing
Only **ONE file**: `packages/backend/src/services/smart-account.service.ts`

---

## The 3 Methods to Implement

### 1. `buildSmartAccount()` - Create Biconomy Client

**Current (Stub)**:
```typescript
private async buildSmartAccount(ownerAddress: Hex): Promise<BiconomySmartAccountV2> {
  // TODO: Implement actual Biconomy SDK
  throw new Error("Not implemented");
}
```

**Real Implementation**:
```typescript
private async buildSmartAccount(sessionPrivateKey: Hex) {
  const { createSmartAccountClient } = await import("@biconomy/account");
  const sessionAccount = privateKeyToAccount(sessionPrivateKey);

  const smartAccount = await createSmartAccountClient({
    signer: sessionAccount,
    bundlerUrl: this.bundlerUrl,
    biconomyPaymasterApiKey: this.paymasterUrl?.split("/").pop(),
    rpcUrl: process.env.BASE_RPC_URL!,
  });

  return smartAccount;
}
```

**Key Changes**:
- Use dynamic import to avoid ESM issues
- Pass session private key, not just address
- Configure bundler + paymaster URLs

---

### 2. `executeEscrowDeposit()` - Batched Transaction

**Current (Stub)**:
```typescript
async executeEscrowDeposit(...): Promise<{...}> {
  // Validation code works ✅
  throw new Error("Not implemented: Biconomy integration pending");
}
```

**Real Implementation**:
```typescript
async executeEscrowDeposit(
  apiKeyId: string,
  orderId: string,
  provider: Hex,
  amount: string,
  deadline: number
): Promise<{ transactionHash: string; userOpHash: string; receipt: any }> {
  // Get session key (this part already works)
  const sessionKey = await prisma.sessionKey.findUnique({
    where: { apiKeyId },
    include: { smartAccount: true },
  });

  if (!sessionKey) throw new Error("Session key not found");
  if (new Date() > sessionKey.expiresAt) throw new Error("Session key expired");

  // Decrypt session private key (already works)
  const privateKey = await keyManagementService.decryptSessionKey(
    sessionKey.encryptedPrivateKey
  );

  // Validate permissions (already works)
  this.validateOperation(
    sessionKey.permissions as any,
    "deposit",
    parseUSDC(amount)
  );

  // 🔧 NEW: Build smart account with Biconomy
  const smartAccount = await this.buildSmartAccount(privateKey as Hex);

  // 🔧 NEW: Encode transaction data
  const amountBigInt = parseUSDC(amount);
  const orderIdBytes32 = this.stringToBytes32(orderId);

  // Approve USDC
  const approveData = encodeFunctionData({
    abi: [
      {
        name: "approve",
        type: "function",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
      },
    ],
    functionName: "approve",
    args: [ESCROW_CONTRACT_ADDRESS, amountBigInt],
  });

  // Deposit to escrow
  const depositData = encodeFunctionData({
    abi: HumanLayerEscrowABI,
    functionName: "deposit",
    args: [provider, orderIdBytes32, amountBigInt, BigInt(deadline)],
  });

  // 🔧 NEW: Send batched transaction
  const userOpResponse = await smartAccount.sendTransaction([
    {
      to: USDC_ADDRESS,
      data: approveData,
      value: 0n,
    },
    {
      to: ESCROW_CONTRACT_ADDRESS,
      data: depositData,
      value: 0n,
    },
  ]);

  // 🔧 NEW: Wait for confirmation
  const { transactionHash } = await userOpResponse.waitForTxHash();
  const receipt = await userOpResponse.wait();

  // Update usage tracking (already works)
  await prisma.sessionKey.update({
    where: { id: sessionKey.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  });

  // Mark as deployed if first tx (already works)
  if (!sessionKey.smartAccount.deployed) {
    await prisma.smartAccount.update({
      where: { id: sessionKey.smartAccountId },
      data: {
        deployed: true,
        deployedAt: new Date(),
      },
    });
  }

  return {
    transactionHash,
    userOpHash: userOpResponse.userOpHash,
    receipt,
  };
}
```

**Key Changes**:
- Replace `throw new Error()` with actual Biconomy calls
- Encode transaction data (approve + deposit)
- Send batched user operation
- Wait for blockchain confirmation
- Everything else stays the same!

---

### 3. `executeEscrowRelease()` - Single Transaction

**Current (Stub)**:
```typescript
async executeEscrowRelease(...): Promise<{...}> {
  // Validation code works ✅
  throw new Error("Not implemented: Biconomy integration pending");
}
```

**Real Implementation**:
```typescript
async executeEscrowRelease(
  apiKeyId: string,
  escrowId: string
): Promise<{ transactionHash: string; userOpHash: string; receipt: any }> {
  // Get session key (already works)
  const sessionKey = await prisma.sessionKey.findUnique({
    where: { apiKeyId },
    include: { smartAccount: true },
  });

  if (!sessionKey) throw new Error("Session key not found");
  if (new Date() > sessionKey.expiresAt) throw new Error("Session key expired");

  // Decrypt private key (already works)
  const privateKey = await keyManagementService.decryptSessionKey(
    sessionKey.encryptedPrivateKey
  );

  // Validate permissions (already works)
  this.validateOperation(sessionKey.permissions as any, "release", 0n);

  // 🔧 NEW: Build smart account
  const smartAccount = await this.buildSmartAccount(privateKey as Hex);

  // 🔧 NEW: Encode release transaction
  const escrowIdBytes32 = this.stringToBytes32(escrowId);
  const releaseData = encodeFunctionData({
    abi: HumanLayerEscrowABI,
    functionName: "release",
    args: [escrowIdBytes32],
  });

  // 🔧 NEW: Send transaction
  const userOpResponse = await smartAccount.sendTransaction({
    to: ESCROW_CONTRACT_ADDRESS,
    data: releaseData,
    value: 0n,
  });

  // 🔧 NEW: Wait for confirmation
  const { transactionHash } = await userOpResponse.waitForTxHash();
  const receipt = await userOpResponse.wait();

  // Update usage (already works)
  await prisma.sessionKey.update({
    where: { id: sessionKey.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  });

  return {
    transactionHash,
    userOpHash: userOpResponse.userOpHash,
    receipt,
  };
}
```

**Key Changes**:
- Replace `throw new Error()` with Biconomy transaction
- Encode release transaction data
- Send single user operation
- Everything else stays the same!

---

## Line-by-Line Diff

### Before (Stub):
```typescript
// Line 142-168
async executeEscrowDeposit(...) {
  // ... validation code ...
  throw new Error("Not implemented: Biconomy integration pending");
}
```

### After (Live):
```typescript
// Line 142-200+
async executeEscrowDeposit(...) {
  // ... same validation code ...

  // NEW CODE STARTS HERE:
  const smartAccount = await this.buildSmartAccount(privateKey as Hex);

  const approveData = encodeFunctionData({...});
  const depositData = encodeFunctionData({...});

  const userOpResponse = await smartAccount.sendTransaction([...]);

  const { transactionHash } = await userOpResponse.waitForTxHash();
  const receipt = await userOpResponse.wait();

  // ... same tracking code ...

  return { transactionHash, userOpHash, receipt };
  // NEW CODE ENDS HERE
}
```

**Only ~20 lines of new code per method!**

---

## Imports to Add

At the top of `smart-account.service.ts`:

```typescript
// Add this import (dynamic import inside methods)
// No need to add at file level due to ESM issues
```

---

## Testing the Implementation

### Test 1: Verify SDK Loads
```typescript
// In buildSmartAccount()
console.log("🔧 Creating Biconomy smart account...");
const { createSmartAccountClient } = await import("@biconomy/account");
console.log("✅ Biconomy SDK loaded");
```

### Test 2: Verify Account Created
```typescript
const smartAccount = await createSmartAccountClient({...});
const address = await smartAccount.getAccountAddress();
console.log("✅ Smart account created:", address);
```

### Test 3: Verify Transaction Sent
```typescript
const userOpResponse = await smartAccount.sendTransaction([...]);
console.log("✅ User operation sent:", userOpResponse.userOpHash);
```

### Test 4: Verify Confirmation
```typescript
const { transactionHash } = await userOpResponse.waitForTxHash();
console.log("✅ Transaction confirmed:", transactionHash);
console.log("🔗 View on Basescan:", `https://sepolia.basescan.org/tx/${transactionHash}`);
```

---

## Environment Setup

### Required .env Variables:
```bash
# These must be set:
BICONOMY_BUNDLER_URL="https://bundler.biconomy.io/api/v2/84532/YOUR_KEY"
BICONOMY_PAYMASTER_URL="https://paymaster.biconomy.io/api/v1/84532/YOUR_KEY"
BASE_RPC_URL="https://sepolia.base.org"
USDC_ADDRESS="0x036CbD53842c5426634e7929541eC2318f3dCF7e"
ESCROW_CONTRACT_ADDRESS="0xYOUR_DEPLOYED_ESCROW"
```

---

## Common Errors & Fixes

### Error: "Module not found: @biconomy/account"
**Fix**: Use dynamic import inside method, not at file level

### Error: "Bundler URL invalid"
**Fix**: Check Biconomy dashboard for exact URL format

### Error: "Insufficient funds"
**Fix**: Fund smart account with USDC, or enable paymaster

### Error: "Transaction reverted"
**Fix**: Check contract addresses and permissions

---

## Summary

**To enable live transactions:**

1. **Replace 3 methods** in `smart-account.service.ts`:
   - `buildSmartAccount()` - ~10 lines
   - `executeEscrowDeposit()` - ~20 lines
   - `executeEscrowRelease()` - ~15 lines

2. **Total new code**: ~45 lines

3. **Everything else stays the same**:
   - ✅ Validation logic
   - ✅ Permission checks
   - ✅ Error handling
   - ✅ Usage tracking
   - ✅ Database updates

**The architecture is ready - just drop in the Biconomy SDK calls!**
