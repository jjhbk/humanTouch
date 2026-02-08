import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const generateNonceSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const verifyWalletSchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1),
});

export const createApiKeySchema = z.object({
  label: z.string().min(1).max(100),
  permissions: z.array(z.string()).default([]),
});

export const becomeProviderSchema = z.object({
  businessName: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  websiteUrl: z.string().url().optional(),
});
