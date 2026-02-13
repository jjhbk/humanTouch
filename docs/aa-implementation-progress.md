# Account Abstraction Implementation Progress

## ✅ Completed Tasks (4/8)

### Task #1: AA Infrastructure Setup ✅
- **Provider**: Biconomy (officially supports Base L2)
- **Packages Installed**:
  - `@biconomy/account@4.5.7`
  - `@biconomy/bundler@3.1.4`
  - `@biconomy/paymaster@3.1.4`
  - `@biconomy/core-types@3.1.4`
  - `@biconomy/modules@3.1.4`
  - `@aws-sdk/client-kms@3.987.0` (optional, for production)
- **Configuration**: Added to `.env.example` and `.env`

### Task #2: Database Schema ✅
- **New Models**:
  - `SmartAccount` - Stores smart account address, deployment status, owner address
  - `SessionKey` - Stores encrypted session keys with permissions, expiry, usage tracking
- **Migration**: Created and applied `20260211101819_add_account_abstraction`
- **Relations**:
  - User → SmartAccount (1:1)
  - SmartAccount → SessionKey (1:many)
  - ApiKey → SessionKey (1:1)

### Task #3: Key Management Service ✅
- **File**: `src/services/key-management.service.ts`
- **Features**:
  - AES-256-GCM encryption for development (local)
  - AWS KMS support for production (optional)
  - Automatic mode detection based on environment
  - Secure key derivation with scrypt
  - Random IV for each encryption (prevents pattern analysis)
- **Tests**: Created test suite in `__tests__/key-management.service.test.ts`
- **Security**: 32-byte encryption key required, validated on startup

### Task #4: Smart Account Service ✅
- **File**: `src/services/smart-account.service.ts`
- **Core Functions**:

  #### 1. `createSmartAccount(userId, apiKeyId)`
  - Generates session keypair
  - Creates Biconomy smart account (counterfactual)
  - Encrypts and stores session key
  - Returns smart account address and session key details
  - Handles existing accounts (creates additional session keys)

  #### 2. `executeEscrowDeposit(apiKeyId, orderId, provider, amount, deadline)`
  - Validates session key (expiry, permissions)
  - Decrypts session private key
  - Builds smart account with Biconomy SDK
  - **Batches transactions**: approve USDC + deposit (atomic!)
  - Returns transaction hash and receipt
  - Tracks usage and updates deployment status

  #### 3. `executeEscrowRelease(apiKeyId, escrowId)`
  - Validates session key
  - Executes release transaction
  - Returns transaction hash
  - Tracks usage

  #### 4. `getBalance(smartAccountAddress)`
  - Returns USDC and ETH balance
  - Used to check if account needs funding

  #### 5. Permission Validation
  - Checks operation against session key permissions
  - Enforces amount limits (10k USDC approval, 1k USDC per order)
  - Validates target contracts (only USDC and Escrow)

- **Default Permissions**:
  ```json
  [
    {
      "target": "USDC_ADDRESS",
      "functionSelector": "0x095ea7b3",  // approve()
      "valueLimit": "0",
      "rules": { "maxAmount": "10000000000" }  // 10k USDC
    },
    {
      "target": "ESCROW_CONTRACT_ADDRESS",
      "functionSelector": "0xd0e30db0",  // deposit()
      "valueLimit": "0",
      "rules": { "maxAmount": "1000000000" }  // 1k USDC
    },
    {
      "target": "ESCROW_CONTRACT_ADDRESS",
      "functionSelector": "0x3ccfd60b",  // release()
      "valueLimit": "0"
    }
  ]
  ```

- **Security Features**:
  - Session keys expire after 90 days
  - Amount limits enforced per transaction
  - Only whitelisted contracts
  - Usage tracking (count + last used timestamp)
  - Encrypted key storage

---

## 🔄 Remaining Tasks (4/8)

### Task #5: Create AA API Endpoints
**Status**: Pending
**What's needed**:
- `POST /api/v1/smart-accounts` - Create smart account
- `GET /api/v1/smart-accounts/balance` - Check balance
- `POST /api/v1/orders/:id/deposit-escrow` - Execute deposit
- `POST /api/v1/orders/:id/release-payment` - Execute release
- Add authentication middleware
- Integrate with orders flow

### Task #6: Update MCP Tools
**Status**: Pending
**What's needed**:
- New tool: `deposit_escrow_funds(orderId, amount)` - Direct blockchain execution
- New tool: `release_payment(orderId)` - Direct blockchain execution
- New tool: `get_smart_account_balance()` - Check funding
- New tool: `get_transaction_status(txHash)` - Track tx confirmation
- Update `create_order` to check for smart account
- Add funding instructions if account needs USDC

### Task #7: End-to-End Testing
**Status**: Pending
**What's needed**:
- Test smart account creation flow
- Test escrow deposit (approve + deposit batch)
- Test escrow release
- Test permission enforcement (exceed limits, wrong contracts)
- Test session key expiry
- Test gas sponsorship (with paymaster)
- Integration tests with real Base Sepolia

### Task #8: Security & Monitoring
**Status**: Pending
**What's needed**:
- Audit logging for all AA operations
- Rate limiting on MCP tools (prevent abuse)
- Unusual activity detection (large amounts, rapid txs)
- Admin dashboard for monitoring smart accounts
- Session key rotation mechanism
- Alert system for failed transactions

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│      AI Agent (via MCP Client)      │
│  - Claude Desktop                   │
│  - Custom AI applications           │
└────────────┬────────────────────────┘
             │ MCP Protocol (HTTP)
             ▼
┌─────────────────────────────────────┐
│      HumanLayer MCP Server          │
│  Tools:                             │
│  - deposit_escrow_funds()           │
│  - release_payment()                │
│  - get_smart_account_balance()      │
└────────────┬────────────────────────┘
             │ REST API
             ▼
┌─────────────────────────────────────┐
│      HumanLayer Backend             │
│                                     │
│  Services:                          │
│  ├─ SmartAccountService             │
│  │   ├─ Create smart accounts       │
│  │   ├─ Execute transactions        │
│  │   └─ Validate permissions        │
│  │                                  │
│  └─ KeyManagementService            │
│      ├─ Encrypt session keys        │
│      └─ Decrypt for signing         │
│                                     │
│  Database:                          │
│  ├─ SmartAccount (address, status)  │
│  └─ SessionKey (encrypted, perms)   │
└────────────┬────────────────────────┘
             │ Biconomy SDK
             ▼
┌─────────────────────────────────────┐
│      Biconomy Infrastructure        │
│  - Bundler (batches user ops)       │
│  - Paymaster (sponsors gas)         │
│  - Smart Account Factory            │
└────────────┬────────────────────────┘
             │ ERC-4337
             ▼
┌─────────────────────────────────────┐
│         Base L2 Blockchain          │
│  - EntryPoint Contract              │
│  - Smart Account Contracts          │
│  - HumanLayer Escrow Contract       │
│  - USDC Contract                    │
└─────────────────────────────────────┘
```

---

## User Flow Example

### Scenario: AI Agent deposits escrow for an order

1. **AI Agent calls MCP tool**:
   ```typescript
   await mcp.callTool("deposit_escrow_funds", {
     orderId: "order_123",
     amount: "100"  // 100 USDC
   });
   ```

2. **MCP Server → Backend API**:
   ```http
   POST /api/v1/orders/order_123/deposit-escrow
   X-API-Key: hl_live_abc123...

   { "amount": "100" }
   ```

3. **Backend validates**:
   - Check API key exists
   - Check order exists and is PENDING
   - Check smart account exists (or create)
   - Validate amount ≤ 1000 USDC (session key limit)

4. **SmartAccountService executes**:
   - Decrypt session private key
   - Build Biconomy smart account
   - Create batched transaction:
     - TX 1: `USDC.approve(escrow, 100e6)`
     - TX 2: `Escrow.deposit(provider, orderId, 100e6, deadline)`
   - Sign user operation with session key
   - Submit to Biconomy bundler

5. **Biconomy processes**:
   - Validates user operation
   - (Optional) Sponsors gas via paymaster
   - Submits to EntryPoint contract
   - EntryPoint executes transactions atomically

6. **Blockchain confirms**:
   - Smart account deployed (if first tx)
   - USDC approved
   - Escrow deposit recorded
   - Event emitted: `EscrowDeposited(orderId, buyer, provider, amount)`

7. **Backend updates**:
   - Order status: PENDING → CONFIRMED
   - Store transaction hash
   - Update session key usage count
   - Mark smart account as deployed

8. **MCP returns to AI Agent**:
   ```json
   {
     "success": true,
     "transactionHash": "0xabc...",
     "status": "confirmed",
     "blockExplorer": "https://basescan.org/tx/0xabc..."
   }
   ```

---

## Security Guarantees

1. **Session Key Isolation**:
   - Each API key gets its own session key
   - Session keys can't interact with other users' orders
   - Private keys never leave the backend (encrypted at rest)

2. **Permission Boundaries**:
   - ✅ Can approve USDC up to 10k
   - ✅ Can deposit to escrow up to 1k per order
   - ✅ Can release escrow (any amount)
   - ❌ Can't transfer USDC directly
   - ❌ Can't interact with other contracts
   - ❌ Can't withdraw from escrow (only release to provider)

3. **Time-bound**:
   - Session keys expire after 90 days
   - Automatic revocation on expiry
   - Manual revocation supported

4. **Usage Tracking**:
   - Every transaction logged
   - Usage count tracked
   - Last used timestamp
   - Audit trail in database

5. **Recovery**:
   - Original owner address stored
   - Admin can help recover account
   - Multi-sig recovery module (future enhancement)

---

## Next Steps

1. **Immediate** (Task #5):
   - Create API endpoints for AA operations
   - Integrate with existing orders flow
   - Add authentication middleware

2. **Then** (Task #6):
   - Update MCP tools to use new AA endpoints
   - Test with MCP Inspector
   - Document AI agent onboarding flow

3. **Finally** (Tasks #7 & #8):
   - End-to-end testing on Base Sepolia
   - Security audit
   - Monitoring dashboard
   - Production deployment

---

## Questions for Discussion

1. **Gas Sponsorship**: Should HumanLayer sponsor gas via paymaster, or should users pay?
   - **Option A**: Sponsor all gas (better UX, costs platform)
   - **Option B**: Users pay gas (need ETH in smart account)
   - **Option C**: Hybrid (sponsor small amounts, users pay for large orders)

2. **Funding Flow**: How should users fund their smart accounts?
   - Show smart account address on dashboard
   - Provide funding instructions
   - Add "Fund Account" button that opens wallet

3. **Rate Limiting**: What limits should we set?
   - Max transactions per minute per API key?
   - Max total USDC per day?
   - Alert thresholds?

4. **Testing Strategy**: Deploy to Base Sepolia first or mainnet?
   - Sepolia testnet: Free testing, get testnet USDC from faucet
   - Mainnet: Real money, need to be confident

Let me know your preferences and I'll continue with Tasks #5-8!
