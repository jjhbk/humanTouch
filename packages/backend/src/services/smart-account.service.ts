/**
 * Smart Account Service - Stub Implementation
 *
 * This is a placeholder implementation. The actual Biconomy integration
 * will be completed during Task #7 (Testing).
 *
 * Current Status: Compiles successfully, methods throw "Not Implemented"
 */

import { createPublicClient, http, type Hex } from "viem";
import { baseSepolia, base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { prisma } from "../lib/prisma.js";
import { keyManagementService } from "./key-management.service.js";
import type { SessionPermission } from "../types/account-abstraction.js";
import { parseUSDC } from "@humanlayer/shared";

const chain = process.env.BASE_CHAIN_ID === "8453" ? base : baseSepolia;

const ESCROW_CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS as Hex;
const USDC_ADDRESS = process.env.USDC_ADDRESS as Hex;

export class SmartAccountService {
  private bundlerUrl: string;
  private paymasterUrl?: string;

  constructor() {
    this.bundlerUrl = process.env.BICONOMY_BUNDLER_URL || "";
    this.paymasterUrl = process.env.BICONOMY_PAYMASTER_URL;
  }

  /**
   * Create a smart account for a user
   */
  async createSmartAccount(userId: string, apiKeyId: string) {
    // Check if user already has a smart account
    const existing = await prisma.smartAccount.findUnique({
      where: { userId },
      include: { sessionKeys: true },
    });

    if (existing) {
      const existingSessionKey = existing.sessionKeys.find(
        (sk) => sk.apiKeyId === apiKeyId
      );

      if (existingSessionKey) {
        return {
          smartAccountAddress: existing.address,
          sessionKey: {
            publicKey: existingSessionKey.publicKey,
            expiresAt: existingSessionKey.expiresAt,
          },
        };
      }

      return this.createSessionKey(existing.id, apiKeyId);
    }

    // Generate session keypair
    const sessionPrivateKey = this.generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPrivateKey);

    // TODO: Integrate actual Biconomy SDK here
    // For now, use session account address as smart account address
    const smartAccountAddress = sessionAccount.address;

    // Store in database
    const dbSmartAccount = await prisma.smartAccount.create({
      data: {
        userId,
        address: smartAccountAddress,
        deployed: false,
        ownerAddress: sessionAccount.address,
        sessionKeys: {
          create: {
            apiKeyId,
            publicKey: sessionAccount.address,
            encryptedPrivateKey: await keyManagementService.encryptSessionKey(
              sessionPrivateKey
            ),
            permissions: this.getDefaultPermissions() as any,
            expiresAt: this.getDefaultExpiry(),
          },
        },
      },
      include: {
        sessionKeys: true,
      },
    });

    return {
      smartAccountAddress,
      sessionKey: {
        publicKey: dbSmartAccount.sessionKeys[0].publicKey,
        expiresAt: dbSmartAccount.sessionKeys[0].expiresAt,
      },
      needsFunding: !dbSmartAccount.deployed,
    };
  }

  /**
   * Create an additional session key
   */
  async createSessionKey(smartAccountId: string, apiKeyId: string) {
    const smartAccount = await prisma.smartAccount.findUnique({
      where: { id: smartAccountId },
    });

    if (!smartAccount) {
      throw new Error("Smart account not found");
    }

    const sessionPrivateKey = this.generatePrivateKey();
    const sessionAccount = privateKeyToAccount(sessionPrivateKey);

    const sessionKey = await prisma.sessionKey.create({
      data: {
        smartAccountId,
        apiKeyId,
        publicKey: sessionAccount.address,
        encryptedPrivateKey: await keyManagementService.encryptSessionKey(
          sessionPrivateKey
        ),
        permissions: this.getDefaultPermissions() as any,
        expiresAt: this.getDefaultExpiry(),
      },
    });

    return {
      smartAccountAddress: smartAccount.address,
      sessionKey: {
        publicKey: sessionKey.publicKey,
        expiresAt: sessionKey.expiresAt,
      },
    };
  }

  /**
   * Execute escrow deposit via smart account
   * TODO: Implement actual Biconomy transaction execution
   */
  async executeEscrowDeposit(
    apiKeyId: string,
    orderId: string,
    provider: Hex,
    amount: string,
    deadline: number
  ): Promise<{ transactionHash: string; userOpHash: string; receipt: any }> {
    // Get session key
    const sessionKey = await prisma.sessionKey.findUnique({
      where: { apiKeyId },
      include: { smartAccount: true },
    });

    if (!sessionKey) {
      throw new Error("Session key not found for API key");
    }

    if (new Date() > sessionKey.expiresAt) {
      throw new Error("Session key expired");
    }

    this.validateOperation(sessionKey.permissions as any, "deposit", parseUSDC(amount));

    // TODO: Implement actual Biconomy transaction execution
    throw new Error("Not implemented: Biconomy integration pending. See Task #7.");
  }

  /**
   * Execute escrow release via smart account
   * TODO: Implement actual Biconomy transaction execution
   */
  async executeEscrowRelease(apiKeyId: string, escrowId: string): Promise<{ transactionHash: string; userOpHash: string; receipt: any }> {
    const sessionKey = await prisma.sessionKey.findUnique({
      where: { apiKeyId },
      include: { smartAccount: true },
    });

    if (!sessionKey) {
      throw new Error("Session key not found for API key");
    }

    if (new Date() > sessionKey.expiresAt) {
      throw new Error("Session key expired");
    }

    this.validateOperation(sessionKey.permissions as any, "release", 0n);

    // TODO: Implement actual Biconomy transaction execution
    throw new Error("Not implemented: Biconomy integration pending. See Task #7.");
  }

  /**
   * Get smart account balance
   */
  async getBalance(smartAccountAddress: Hex) {
    const publicClient = createPublicClient({
      chain,
      transport: http(process.env.BASE_RPC_URL),
    });

    const usdcBalance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ],
      functionName: "balanceOf",
      args: [smartAccountAddress],
    });

    const ethBalance = await publicClient.getBalance({
      address: smartAccountAddress,
    });

    return {
      usdc: usdcBalance,
      eth: ethBalance,
    };
  }

  private validateOperation(
    permissions: SessionPermission[],
    operation: "approve" | "deposit" | "release",
    amount: bigint
  ) {
    const relevantPermission = permissions.find((p) => {
      if (operation === "approve") {
        return p.target.toLowerCase() === USDC_ADDRESS?.toLowerCase();
      } else {
        return p.target.toLowerCase() === ESCROW_CONTRACT_ADDRESS?.toLowerCase();
      }
    });

    if (!relevantPermission) {
      throw new Error(`No permission for operation: ${operation}`);
    }

    if (relevantPermission.rules?.maxAmount && amount > BigInt(relevantPermission.rules.maxAmount)) {
      throw new Error(
        `Amount ${amount} exceeds max allowed ${relevantPermission.rules.maxAmount}`
      );
    }
  }

  private getDefaultPermissions(): SessionPermission[] {
    return [
      {
        target: USDC_ADDRESS || "",
        functionSelector: "0x095ea7b3",
        valueLimit: "0",
        rules: {
          maxAmount: parseUSDC("10000").toString(),
        },
      },
      {
        target: ESCROW_CONTRACT_ADDRESS || "",
        functionSelector: "0xd0e30db0",
        valueLimit: "0",
        rules: {
          maxAmount: parseUSDC("1000").toString(),
        },
      },
      {
        target: ESCROW_CONTRACT_ADDRESS || "",
        functionSelector: "0x3ccfd60b",
        valueLimit: "0",
      },
    ];
  }

  private getDefaultExpiry(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 90);
    return now;
  }

  private generatePrivateKey(): Hex {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return `0x${Buffer.from(randomBytes).toString("hex")}` as Hex;
  }
}

export const smartAccountService = new SmartAccountService();
