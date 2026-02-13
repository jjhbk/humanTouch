# Account Abstraction Implementation for HumanLayer MCP

## Overview

Enable AI agents to execute blockchain transactions securely via Account Abstraction (ERC-4337), allowing automated escrow deposits and releases while maintaining security through session keys with granular permissions.

## Architecture

### 1. Smart Account Stack

We'll use **ZeroDev** or **Biconomy** as they both support Base L2 and have good TypeScript SDKs.

```
┌─────────────────────────────────────────────┐
│           AI Agent (MCP Client)             │
└─────────────────┬───────────────────────────┘
                  │ MCP Tools
                  ▼
┌─────────────────────────────────────────────┐
│         HumanLayer MCP Server               │
│  - Session Key Management                   │
│  - Transaction Builder                      │
│  - Policy Enforcement                       │
└─────────────────┬───────────────────────────┘
                  │ Smart Account SDK
                  ▼
┌─────────────────────────────────────────────┐
│      Smart Account Provider (ZeroDev)       │
│  - Kernel Smart Account (ERC-4337)          │
│  - Session Key Validator Plugin             │
│  - Permission Policies                      │
└─────────────────┬───────────────────────────┘
                  │ Bundler
                  ▼
┌─────────────────────────────────────────────┐
│            Base L2 Blockchain               │
│  - EntryPoint Contract (0x5FF...2dD)        │
│  - HumanLayer Escrow Contract               │
│  - USDC Contract                            │
└─────────────────────────────────────────────┘
```

### 2. Session Key System

Each AI agent (API key) gets:
- **Master Smart Account** (created on first use)
- **Session Key** (ECDSA keypair for specific operations)
- **Permission Policy** (what can be executed)

#### Session Key Structure:

```typescript
interface SessionKeyData {
  apiKeyId: string;
  smartAccountAddress: string;
  sessionPublicKey: string;
  sessionPrivateKey: string; // Encrypted with KMS
  permissions: SessionPermission[];
  expiresAt: Date;
  createdAt: Date;
}

interface SessionPermission {
  target: string; // Contract address
  functionSelector: string; // e.g., "0x1234..." for deposit()
  valueLimit: bigint; // Max ETH value per tx
  rules?: {
    maxAmount?: bigint; // Max USDC amount
    allowedRecipients?: string[]; // Whitelist providers
  };
}
```

#### Example Session Key Permissions:

```typescript
const aiAgentSessionPermissions = [
  {
    target: USDC_ADDRESS,
    functionSelector: "0x095ea7b3", // approve(address,uint256)
    valueLimit: 0n,
    rules: {
      allowedRecipients: [ESCROW_CONTRACT_ADDRESS],
      maxAmount: parseUSDC("10000"), // Max 10k USDC per approval
    },
  },
  {
    target: ESCROW_CONTRACT_ADDRESS,
    functionSelector: "0xd0e30db0", // deposit(address,bytes32,uint256,uint256)
    valueLimit: 0n,
    rules: {
      maxAmount: parseUSDC("1000"), // Max 1k USDC per order
    },
  },
  {
    target: ESCROW_CONTRACT_ADDRESS,
    functionSelector: "0x3ccfd60b", // release(bytes32)
    valueLimit: 0n,
  },
];
```

### 3. User Flow

#### A. Smart Account Creation (One-time per API key)

```
1. User creates API key via backend
2. Backend generates session keypair
3. Backend deploys smart account (counterfactual - only address at first)
4. Backend sets up session key permissions
5. User funds smart account with USDC
```

#### B. Escrow Deposit via MCP

```
AI Agent → MCP Tool: deposit_escrow_funds(orderId, amount)
           ↓
MCP Server: Build user operation:
           - approve(escrow, amount)
           - deposit(provider, orderId, amount, deadline)
           ↓
Session Key: Sign user operation
           ↓
Bundler: Submit to EntryPoint
           ↓
Blockchain: Execute transactions atomically
           ↓
MCP Server: Wait for receipt, update backend
           ↓
AI Agent ← Return: { txHash, escrowId, status }
```

#### C. Release Payment via MCP

```
AI Agent → MCP Tool: release_payment(orderId)
           ↓
MCP Server: Validate order is DELIVERED
           Build user operation: release(escrowId)
           ↓
Session Key: Sign user operation
           ↓
Blockchain: Execute release
           ↓
AI Agent ← Return: { txHash, status }
```

## Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)

**1.1 Choose AA Provider**
- **ZeroDev** (Recommended)
  - Pros: Best docs, supports Base, session keys built-in
  - Cons: Newer, smaller ecosystem
- **Biconomy**
  - Pros: Battle-tested, large ecosystem
  - Cons: More complex SDK

**1.2 Install Dependencies**
```bash
pnpm add @zerodev/sdk @zerodev/ecdsa-validator viem permissionless
```

**1.3 Deploy AA Contracts**
- EntryPoint already deployed on Base (0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789)
- Smart account factory (use ZeroDev's deployed factory)

### Phase 2: Backend Integration (Week 2)

**2.1 Session Key Storage**

Add to Prisma schema:
```prisma
model SmartAccount {
  id                String   @id @default(uuid())
  userId            String   @unique
  address           String   @unique
  deployed          Boolean  @default(false)
  createdAt         DateTime @default(now())

  user              User     @relation(fields: [userId], references: [id])
  sessionKeys       SessionKey[]
}

model SessionKey {
  id                String   @id @default(uuid())
  smartAccountId    String
  apiKeyId          String   @unique
  publicKey         String
  encryptedPrivateKey String  // Encrypted with AWS KMS or similar
  permissions       Json      // Array of SessionPermission
  expiresAt         DateTime
  lastUsedAt        DateTime?
  createdAt         DateTime @default(now())

  smartAccount      SmartAccount @relation(fields: [smartAccountId], references: [id])
  apiKey            ApiKey   @relation(fields: [apiKeyId], references: [id])
}
```

**2.2 Key Management Service**

```typescript
// packages/backend/src/services/key-management.service.ts
import { KMS } from 'aws-sdk';

export class KeyManagementService {
  private kms: KMS;

  async encryptSessionKey(privateKey: string): Promise<string> {
    // Encrypt with AWS KMS or similar
    const result = await this.kms.encrypt({
      KeyId: process.env.KMS_KEY_ID!,
      Plaintext: Buffer.from(privateKey),
    }).promise();

    return result.CiphertextBlob!.toString('base64');
  }

  async decryptSessionKey(encryptedKey: string): Promise<string> {
    const result = await this.kms.decrypt({
      CiphertextBlob: Buffer.from(encryptedKey, 'base64'),
    }).promise();

    return result.Plaintext!.toString();
  }
}
```

**2.3 Smart Account Service**

```typescript
// packages/backend/src/services/smart-account.service.ts
import { createKernelAccount, createZeroDevPaymasterClient } from '@zerodev/sdk';
import { privateKeyToAccount } from 'viem/accounts';

export class SmartAccountService {
  async createSmartAccount(userId: string, apiKeyId: string) {
    // Generate session keypair
    const sessionAccount = privateKeyToAccount(generatePrivateKey());

    // Create kernel account (counterfactual)
    const kernelAccount = await createKernelAccount(publicClient, {
      signer: sessionAccount,
      validator: sessionKeyValidator,
      permissions: SESSION_PERMISSIONS,
    });

    // Store in database
    const smartAccount = await prisma.smartAccount.create({
      data: {
        userId,
        address: kernelAccount.address,
        sessionKeys: {
          create: {
            apiKeyId,
            publicKey: sessionAccount.address,
            encryptedPrivateKey: await kms.encrypt(sessionAccount.privateKey),
            permissions: SESSION_PERMISSIONS,
            expiresAt: add(new Date(), { days: 90 }),
          },
        },
      },
    });

    return smartAccount;
  }

  async executeUserOperation(apiKeyId: string, operation: UserOperation) {
    // Retrieve session key
    const sessionKey = await prisma.sessionKey.findUnique({
      where: { apiKeyId },
    });

    // Decrypt private key
    const privateKey = await kms.decrypt(sessionKey.encryptedPrivateKey);

    // Build and sign user operation
    const kernelAccount = await createKernelAccount(/* ... */);
    const txHash = await kernelAccount.sendUserOperation(operation);

    return txHash;
  }
}
```

### Phase 3: MCP Tools (Week 3)

**3.1 New MCP Tools**

```typescript
// packages/mcp-server/src/tools/deposit-escrow-funds.ts
export function registerDepositEscrowFunds(server: McpServer) {
  server.tool(
    "deposit_escrow_funds",
    "Deposit USDC into escrow for an order. This executes blockchain transaction via your smart account.",
    {
      orderId: z.string(),
      amount: z.string().describe("USDC amount (e.g., '100.50')"),
    },
    async (params) => {
      try {
        // Call backend to execute via smart account
        const result = await apiClient.post('/orders/deposit-escrow', {
          orderId: params.orderId,
          amount: params.amount,
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              txHash: result.data.txHash,
              escrowId: result.data.escrowId,
              status: "Transaction confirmed on-chain",
              blockExplorer: `https://basescan.org/tx/${result.data.txHash}`,
            }, null, 2)
          }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    }
  );
}
```

**3.2 Additional Tools**
- `get_smart_account_balance` - Check USDC balance
- `fund_smart_account` - Instructions to fund account
- `release_escrow_payment` - Release funds after delivery
- `get_transaction_status` - Check tx confirmation

### Phase 4: Security & Testing (Week 4)

**4.1 Security Measures**
- ✅ Session keys expire after 90 days
- ✅ Per-transaction amount limits
- ✅ Whitelist only HumanLayer contracts
- ✅ Encrypted key storage with KMS
- ✅ Rate limiting on MCP tools
- ✅ Audit logs for all transactions

**4.2 Testing**
```bash
# Test smart account creation
npm run test:aa:create

# Test escrow deposit via session key
npm run test:aa:deposit

# Test permissions enforcement
npm run test:aa:permissions

# Test key rotation
npm run test:aa:rotation
```

## Cost Analysis

### Gas Costs (Base L2)
- Smart account deployment: ~$0.10
- User operation (approve + deposit): ~$0.02
- Release payment: ~$0.01

### With Paymaster (Optional)
- HumanLayer can sponsor gas for AI agents
- Deduct gas fees from escrow amount
- Better UX for AI agents

## Security Considerations

### 1. Session Key Compromise
**Risk**: If session key leaks, attacker can execute operations within limits
**Mitigation**:
- Short expiry (90 days)
- Amount limits per transaction
- Whitelist contracts only
- Monitor for unusual activity

### 2. Smart Account Control
**Risk**: User loses access to smart account
**Mitigation**:
- Multi-sig recovery module
- Guardian system (backend + user email)
- Time-locked recovery process

### 3. Backend Compromise
**Risk**: Attacker gains access to encrypted keys
**Mitigation**:
- AWS KMS for encryption (keys never in plaintext)
- HSM for production
- Audit logs
- Intrusion detection

## Migration Path

### Phase 1: Hybrid Mode (Month 1)
- New API keys get smart accounts
- Existing users can opt-in
- Support both manual + automated flows

### Phase 2: Full AA (Month 2-3)
- Migrate existing users
- Deprecate manual flow
- Full AA for all agents

## Alternative: Simpler Approach

If full ERC-4337 is too complex initially, we can do:

### **Managed Signer Pattern**
1. Backend creates EOA wallet per API key (not smart account)
2. Private key encrypted with KMS
3. Backend validates and signs transactions
4. Simpler but less flexible than AA

**Pros**: Easier to implement, works immediately
**Cons**: No batching, no gas sponsorship, less features

## Recommendation

**Start with Managed Signer**, then migrate to full AA in v2:

**v1 (Now)**: Managed EOA wallets
- Quick implementation (1 week)
- Solves immediate automation need
- Encrypted key management with KMS

**v2 (3 months)**: Full Account Abstraction
- Session keys with granular permissions
- Gas sponsorship via paymaster
- Batched transactions
- Better security model

This gives us working automation now while planning for scalable AA later.

## Next Steps

1. **Decision**: Full AA now or Managed Signer first?
2. **KMS Setup**: AWS KMS or local encryption for dev?
3. **Provider Choice**: ZeroDev vs Biconomy vs custom?
4. **Budget**: Gas sponsorship or user-pays?

Let me know which approach you prefer and I'll start implementation!
