/**
 * Recovery script to extract escrowIds from old orders that have escrowTxHash but no escrowId
 *
 * Run with: pnpm tsx src/scripts/recover-escrow-ids.ts
 */

import { prisma } from "../lib/prisma.js";
import { createPublicClient, http, parseEventLogs } from "viem";
import { baseSepolia } from "viem/chains";
import { HumanLayerEscrowABI } from "@humanlayer/shared";

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_RPC_URL || "https://sepolia.base.org"),
});

async function recoverEscrowIds() {
  console.log("🔍 Finding orders with escrowTxHash but no escrowId...\n");

  // Find all orders that have escrowTxHash but no escrowId
  const orders = await prisma.order.findMany({
    where: {
      escrowTxHash: { not: null },
      escrowId: null,
    },
    select: {
      id: true,
      orderNumber: true,
      escrowTxHash: true,
    },
  });

  if (orders.length === 0) {
    console.log("✅ No orders need escrowId recovery!");
    return;
  }

  console.log(`Found ${orders.length} orders that need escrowId recovery:\n`);

  let successCount = 0;
  let failCount = 0;

  for (const order of orders) {
    try {
      console.log(`📦 Order ${order.orderNumber} (${order.id})`);
      console.log(`   Tx: ${order.escrowTxHash}`);

      // Fetch transaction receipt
      const receipt = await publicClient.getTransactionReceipt({
        hash: order.escrowTxHash as `0x${string}`,
      });

      // Parse EscrowCreated event
      let escrowId: string | null = null;

      try {
        const logs = parseEventLogs({
          abi: HumanLayerEscrowABI,
          logs: receipt.logs,
          eventName: "EscrowCreated",
        });

        if (logs.length > 0) {
          escrowId = logs[0].args.escrowId as string;
        }
      } catch (parseError) {
        console.log(`   ⚠️  Event parsing failed, trying manual extraction...`);
      }

      // Fallback: Manually extract escrowId from logs
      // EscrowCreated event signature: 0xecfc64e6b5d00db90b689255403357841334dfc94584137e88c526dc65cbb713
      if (!escrowId) {
        const escrowCreatedSignature = "0xecfc64e6b5d00db90b689255403357841334dfc94584137e88c526dc65cbb713";
        const escrowLog = receipt.logs.find(
          (log) => log.topics[0]?.toLowerCase() === escrowCreatedSignature.toLowerCase()
        );

        if (escrowLog && escrowLog.topics[1]) {
          escrowId = escrowLog.topics[1]; // escrowId is the first indexed parameter (topic[1])
          console.log(`   ✅ Manually extracted escrowId from topics`);
        }
      }

      if (!escrowId) {
        console.log(`   ❌ No EscrowCreated event found in transaction`);
        console.log(`   ℹ️  This might be:`);
        console.log(`      - An APPROVE transaction (step 1, not the deposit)`);
        console.log(`      - A failed transaction`);
        console.log(`      - Wrong contract interaction`);
        console.log(`   🔗 View on explorer: https://sepolia.basescan.org/tx/${order.escrowTxHash}`);

        // Check all events in the transaction
        console.log(`   📝 Events found: ${receipt.logs.length}`);
        if (receipt.logs.length > 0) {
          console.log(`      First event from: ${receipt.logs[0].address}`);
          console.log(`      Topic[0]: ${receipt.logs[0].topics[0]}`);
        }
        console.log(``);
        failCount++;
        continue;
      }
      console.log(`   ✅ Found escrowId: ${escrowId}`);

      // Update database
      await prisma.order.update({
        where: { id: order.id },
        data: { escrowId },
      });

      console.log(`   💾 Updated database\n`);
      successCount++;
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      failCount++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Recovered: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📝 Total: ${orders.length}`);
}

recoverEscrowIds()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
