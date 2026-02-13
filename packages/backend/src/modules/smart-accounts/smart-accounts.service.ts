import { prisma } from "../../lib/prisma.js";
import { smartAccountService } from "../../services/smart-account.service.js";
import type { Hex } from "viem";

export class SmartAccountsService {
  /**
   * Create or get smart account for a user
   */
  async createOrGetSmartAccount(userId: string, apiKeyId: string) {
    // Check if user already has a smart account
    const existing = await prisma.smartAccount.findUnique({
      where: { userId },
      include: {
        sessionKeys: {
          where: { apiKeyId },
        },
      },
    });

    if (existing && existing.sessionKeys.length > 0) {
      // Smart account exists and has session key for this API key
      const sessionKey = existing.sessionKeys.find(
        (sk: any) => sk.apiKeyId === apiKeyId
      ) || existing.sessionKeys[0];

      return {
        smartAccountAddress: existing.address,
        deployed: existing.deployed,
        sessionKey: {
          publicKey: sessionKey.publicKey,
          expiresAt: sessionKey.expiresAt,
        },
      };
    }

    // Create new smart account or add session key
    const result = await smartAccountService.createSmartAccount(userId, apiKeyId);

    return result;
  }

  /**
   * Get smart account balance
   */
  async getBalance(userId: string) {
    const smartAccount = await prisma.smartAccount.findUnique({
      where: { userId },
    });

    if (!smartAccount) {
      throw new Error("Smart account not found. Create one first.");
    }

    const balance = await smartAccountService.getBalance(smartAccount.address as Hex);

    return {
      address: smartAccount.address,
      balances: {
        usdc: balance.usdc.toString(),
        eth: balance.eth.toString(),
      },
    };
  }

  /**
   * Deposit escrow via smart account
   */
  async depositEscrow(userId: string, apiKeyId: string, orderId: string, amount: string) {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        provider: {
          select: { walletAddress: true },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.buyerId !== userId) {
      throw new Error("You are not the buyer of this order");
    }

    if (order.status !== "PENDING") {
      throw new Error(`Order must be PENDING. Current status: ${order.status}`);
    }

    if (!order.provider.walletAddress) {
      throw new Error("Provider wallet address not found");
    }

    // Calculate deadline (e.g., 30 days from now)
    const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    try {
      // Execute deposit via smart account
      const result = await smartAccountService.executeEscrowDeposit(
        apiKeyId,
        orderId,
        order.provider.walletAddress as Hex,
        amount,
        deadline
      );

      // Update order with transaction details
      await prisma.order.update({
        where: { id: orderId },
        data: {
          escrowTxHash: result.transactionHash,
          escrowId: result.userOpHash,
          status: "CONFIRMED",
        },
      });

      // Create status log
      await prisma.orderStatusLog.create({
        data: {
          orderId,
          fromStatus: "PENDING",
          toStatus: "CONFIRMED",
          changedBy: userId,
          reason: `Escrow deposit via smart account. Tx: ${result.transactionHash}`,
        },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          txHash: result.transactionHash,
          type: "ESCROW_DEPOSIT",
          fromAddress: result.receipt.from || "",
          toAddress: process.env.ESCROW_CONTRACT_ADDRESS || "",
          amount: amount,
          chainId: parseInt(process.env.BASE_CHAIN_ID || "84532"),
          orderId,
          status: "CONFIRMED",
        },
      });

      return {
        transactionHash: result.transactionHash,
        userOpHash: result.userOpHash,
        orderId,
        newStatus: "CONFIRMED",
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("Not implemented")) {
        throw new Error(
          "Smart account transactions are not yet implemented. " +
          "This feature will be available after Biconomy SDK integration (Task #7). " +
          "For now, please use the manual escrow deposit flow."
        );
      }
      throw error;
    }
  }

  /**
   * Release escrow payment via smart account
   */
  async releasePayment(userId: string, apiKeyId: string, orderId: string) {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.buyerId !== userId) {
      throw new Error("You are not the buyer of this order");
    }

    if (!["DELIVERED", "IN_PROGRESS", "CONFIRMED"].includes(order.status)) {
      throw new Error(
        `Order cannot be released. Current status: ${order.status}. Must be DELIVERED, IN_PROGRESS, or CONFIRMED.`
      );
    }

    if (!order.escrowId) {
      throw new Error("Escrow ID not found. Deposit may not have been completed.");
    }

    try {
      // Execute release via smart account
      const result = await smartAccountService.executeEscrowRelease(apiKeyId, order.escrowId);

      // Update order
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      // Create status log
      await prisma.orderStatusLog.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: "COMPLETED",
          changedBy: userId,
          reason: `Payment released via smart account. Tx: ${result.transactionHash}`,
        },
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          txHash: result.transactionHash,
          type: "ESCROW_RELEASE",
          fromAddress: result.receipt.from || "",
          toAddress: process.env.ESCROW_CONTRACT_ADDRESS || "",
          amount: order.amount,
          chainId: parseInt(process.env.BASE_CHAIN_ID || "84532"),
          orderId,
          status: "CONFIRMED",
        },
      });

      return {
        transactionHash: result.transactionHash,
        userOpHash: result.userOpHash,
        orderId,
        newStatus: "COMPLETED",
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("Not implemented")) {
        throw new Error(
          "Smart account transactions are not yet implemented. " +
          "This feature will be available after Biconomy SDK integration (Task #7). " +
          "For now, please use the manual escrow release flow."
        );
      }
      throw error;
    }
  }

  /**
   * Check daily USDC spending limit
   */
  async checkDailyLimit(userId: string, amount: string): Promise<void> {
    const MAX_DAILY_USDC = process.env.AA_MAX_DAILY_USDC || "10000"; // Default 10k USDC per day

    // Get today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysOrders = await prisma.order.findMany({
      where: {
        buyerId: userId,
        status: { in: ["CONFIRMED", "IN_PROGRESS", "DELIVERED", "COMPLETED"] },
        updatedAt: { gte: today },
      },
      select: { amount: true },
    });

    // Calculate total spent today
    const totalSpentToday = todaysOrders.reduce(
      (sum: number, order: { amount: any }) => sum + parseFloat(order.amount.toString()),
      0
    );

    const newTotal = totalSpentToday + parseFloat(amount);

    if (newTotal > parseFloat(MAX_DAILY_USDC)) {
      throw new Error(
        `Daily limit exceeded. You've spent ${totalSpentToday.toFixed(2)} USDC today. ` +
        `Max daily limit: ${MAX_DAILY_USDC} USDC. ` +
        `This transaction (${amount} USDC) would exceed the limit.`
      );
    }
  }

  /**
   * Get user's smart account details
   */
  async getUserSmartAccount(userId: string) {
    const smartAccount = await prisma.smartAccount.findUnique({
      where: { userId },
      include: {
        sessionKeys: {
          select: {
            id: true,
            publicKey: true,
            expiresAt: true,
            lastUsedAt: true,
            usageCount: true,
            createdAt: true,
            apiKey: {
              select: {
                label: true,
                keyPrefix: true,
              },
            },
          },
        },
      },
    });

    return smartAccount;
  }
}

export const smartAccountsService = new SmartAccountsService();
