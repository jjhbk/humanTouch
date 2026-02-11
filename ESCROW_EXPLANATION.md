# Escrow ID Explanation

## What is escrowId?

The `escrowId` is a unique identifier for each escrow deposit in the smart contract.

### How It's Generated
```solidity
// In HumanLayerEscrow.sol deposit() function
bytes32 escrowId = keccak256(
    abi.encodePacked(msg.sender, provider, orderId, block.timestamp)
);
```

### Why We Need It
1. **Contract Storage**: The contract stores escrow data in a mapping:
   ```solidity
   mapping(bytes32 => Escrow) public escrows;
   ```

2. **Release Function**: To release payment, we must provide the escrowId:
   ```solidity
   function release(bytes32 escrowId) external {
       Escrow storage escrow = escrows[escrowId];
       // ... transfer funds
   }
   ```

3. **Without escrowId**: The contract has no way to know which escrow to release

## Current Implementation

### Problem
We're not properly capturing the escrowId when deposit happens because:
- The contract returns escrowId from deposit()
- But wagmi's `useWriteContract` doesn't give us the return value
- We need to read it from transaction logs/events

### Temporary Solution
Using txHash as escrowId reference:
```typescript
const escrowId = txHash; // Transaction hash
```

**This works IF:**
- The contract emits an event with escrowId
- We read the escrowId from transaction receipt
- Backend can query the contract to get escrow details

### Better Solution (TODO)

Read escrowId from transaction receipt:

```typescript
import { usePublicClient } from 'wagmi';
import { parseEventLogs } from 'viem';

// After deposit transaction confirms
const receipt = await publicClient.waitForTransactionReceipt({
  hash: depositHash
});

// Parse EscrowCreated event
const escrowCreatedLog = parseEventLogs({
  abi: ESCROW_ABI,
  logs: receipt.logs,
  eventName: 'EscrowCreated'
});

const escrowId = escrowCreatedLog[0].args.escrowId;
```

## Why Button Shows "Mark as Complete (No Escrow)"

**For existing orders created before escrowId capture:**
- No escrowId in database
- Can't call contract release() without it
- Fallback: Just mark order as complete in database
- Payment already happened during deposit

**For new orders:**
- Will capture escrowId during deposit
- Button shows "Release Payment to Provider"
- Calls smart contract to release funds

## The Escrow Flow

### Complete Flow (With EscrowId)
```
1. Buyer deposits → Contract generates escrowId
2. We capture escrowId from transaction
3. Store in database: { escrowTxHash, escrowId }
4. Later: Call contract.release(escrowId)
5. Contract transfers funds to provider
```

### Current Flow (Simplified)
```
1. Buyer deposits → Get txHash
2. Store in database: { escrowTxHash }
3. Later: Mark order complete in database
4. (Payment already with provider from deposit)
```

## Testing

### Check if order has escrowId:
```sql
SELECT id, orderNumber, escrowTxHash, escrowId
FROM "Order"
WHERE id = 'YOUR_ORDER_ID';
```

### If escrowId is NULL:
- Button shows: "Mark as Complete (No Escrow)"
- Clicking completes order without blockchain transaction

### If escrowId is present:
- Button shows: "Release Payment to Provider"
- Clicking calls smart contract release()

## Fix for Future Orders

Update the deposit hook to capture escrowId properly:

1. Add event parsing
2. Read escrowId from EscrowCreated event
3. Send to backend along with txHash
4. Release button will work with actual contract call

## Why This Matters

**With proper escrowId:**
- ✅ True escrow (funds locked until release)
- ✅ Buyer can refund if provider doesn't deliver
- ✅ Platform fee collected correctly
- ✅ Dispute resolution works through contract

**Without escrowId:**
- ❌ Just database status update
- ❌ No actual blockchain release
- ❌ Payment may have already been sent
- ❌ No platform fee collection

## Recommendation

For production, implement proper escrowId capture from transaction events. For now, the fallback "Mark as Complete" works for testing.
