import type { Hex } from "viem";

/**
 * Session key permission for a smart account
 * Defines what operations a session key can perform
 */
export interface SessionPermission {
  /** Contract address this permission applies to */
  target: string;

  /** Function selector (e.g., "0x095ea7b3" for approve) */
  functionSelector: string;

  /** Maximum ETH value per transaction */
  valueLimit: string;

  /** Additional rules */
  rules?: {
    /** Maximum token amount per transaction */
    maxAmount?: string;

    /** Whitelist of allowed recipient addresses */
    allowedRecipients?: string[];

    /** Rate limiting: max transactions per time window */
    rateLimit?: {
      maxTransactions: number;
      windowSeconds: number;
    };
  };
}

/**
 * Smart account creation result
 */
export interface SmartAccountCreationResult {
  smartAccountAddress: string;
  sessionKey: {
    publicKey: string;
    expiresAt: Date;
  };
  needsFunding?: boolean;
}

/**
 * Transaction result from smart account
 */
export interface SmartAccountTransactionResult {
  transactionHash: string;
  userOpHash: string;
  receipt: any;
}

/**
 * Smart account balance
 */
export interface SmartAccountBalance {
  usdc: bigint;
  eth: bigint;
}
