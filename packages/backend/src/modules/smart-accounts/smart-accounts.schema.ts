import { z } from "zod";

export const createSmartAccountSchema = z.object({
  body: z.object({
    apiKeyId: z.string().cuid().optional(), // Optional, defaults to current API key
  }),
});

export const depositEscrowSchema = z.object({
  params: z.object({
    orderId: z.string().cuid(),
  }),
  body: z.object({
    amount: z.string().regex(/^\d+(\.\d{1,6})?$/, "Invalid USDC amount format"),
  }),
});

export const releasePaymentSchema = z.object({
  params: z.object({
    orderId: z.string().cuid(),
  }),
});

export const getBalanceSchema = z.object({
  query: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address").optional(),
  }),
});
