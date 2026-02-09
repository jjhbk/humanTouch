import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import { SiweMessage } from "siwe";
import { prisma } from "../../lib/prisma.js";
import { UnauthorizedError, ConflictError, NotFoundError, ValidationError } from "../../lib/errors.js";
import { API_KEY_PREFIX } from "@humanlayer/shared";
import type { AuthTokens, UserRole, ApiKeyInfo } from "@humanlayer/shared";

function generateAccessToken(userId: string, role: UserRole, authMethod: "email" | "wallet" | "apikey"): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.sign({ sub: userId, role, authMethod }, secret, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
  } as jwt.SignOptions);
}

async function generateTokens(userId: string, role: UserRole, authMethod: "email" | "wallet"): Promise<AuthTokens> {
  const accessToken = generateAccessToken(userId, role, authMethod);
  const refreshTokenValue = randomBytes(40).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId,
      expiresAt,
    },
  });

  return { accessToken, refreshToken: refreshTokenValue };
}

export async function register(email: string, password: string, name?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError("Email already registered");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  const tokens = await generateTokens(user.id, user.role as UserRole, "email");
  return { user: { id: user.id, email: user.email, role: user.role, name: user.name }, tokens };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw new UnauthorizedError("Invalid credentials");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("Invalid credentials");

  const tokens = await generateTokens(user.id, user.role as UserRole, "email");
  return { user: { id: user.id, email: user.email, role: user.role, name: user.name }, tokens };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await generateTokens(
    stored.user.id,
    stored.user.role as UserRole,
    stored.user.walletAddress ? "wallet" : "email"
  );
  return tokens;
}

export async function generateNonce(walletAddress: string) {
  const nonce = randomBytes(16).toString("hex");
  await prisma.user.upsert({
    where: { walletAddress },
    update: { nonce },
    create: { walletAddress, nonce },
  });
  return nonce;
}

export async function verifyWallet(message: string, signature: string) {
  const siweMessage = new SiweMessage(message);
  const result = await siweMessage.verify({ signature });

  if (!result.success) throw new UnauthorizedError("Invalid signature");

  const address = siweMessage.address;
  const user = await prisma.user.findUnique({ where: { walletAddress: address } });
  if (!user) throw new NotFoundError("User");

  if (user.nonce !== siweMessage.nonce) {
    throw new UnauthorizedError("Invalid nonce");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { nonce: null },
  });

  const tokens = await generateTokens(user.id, user.role as UserRole, "wallet");
  return {
    user: { id: user.id, walletAddress: user.walletAddress, role: user.role, name: user.name },
    tokens,
  };
}

export async function createApiKey(
  userId: string,
  label: string,
  permissions: string[]
): Promise<{ key: string; apiKey: ApiKeyInfo }> {
  const rawKey = `${API_KEY_PREFIX}${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, API_KEY_PREFIX.length + 8);

  const apiKey = await prisma.apiKey.create({
    data: { keyHash, keyPrefix, label, permissions, userId },
  });

  return {
    key: rawKey,
    apiKey: {
      id: apiKey.id,
      keyPrefix: apiKey.keyPrefix,
      label: apiKey.label,
      permissions: apiKey.permissions,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
    },
  };
}

export async function listApiKeys(userId: string): Promise<ApiKeyInfo[]> {
  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: { id: true, keyPrefix: true, label: true, permissions: true, lastUsedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return keys;
}

export async function revokeApiKey(userId: string, keyId: string) {
  const key = await prisma.apiKey.findFirst({ where: { id: keyId, userId } });
  if (!key) throw new NotFoundError("API key");

  await prisma.apiKey.delete({ where: { id: keyId } });
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { providerProfile: true },
  });
  if (!user) throw new NotFoundError("User");
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function updateMe(userId: string, data: { walletAddress?: string; name?: string }) {
  const updateData: Record<string, unknown> = {};

  // Handle wallet address update with uniqueness check
  if (data.walletAddress !== undefined) {
    // Check if wallet is already used by another user
    const existingWallet = await prisma.user.findUnique({
      where: { walletAddress: data.walletAddress },
    });

    if (existingWallet && existingWallet.id !== userId) {
      throw new ConflictError("This wallet address is already connected to another account");
    }

    updateData.walletAddress = data.walletAddress;
  }

  if (data.name !== undefined) updateData.name = data.name;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: { providerProfile: true },
  });

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function becomeProvider(
  userId: string,
  businessName: string,
  description?: string,
  websiteUrl?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { providerProfile: true },
  });

  if (!user) throw new NotFoundError("User");
  if (user.providerProfile) throw new ConflictError("User is already a provider");

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { role: "PROVIDER" },
    });

    await tx.providerProfile.create({
      data: {
        userId,
        businessName,
        description: description || null,
        websiteUrl: websiteUrl || null,
      },
    });
  });

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { providerProfile: true },
  });

  const { passwordHash: _, ...safeUser } = updatedUser!;
  return safeUser;
}
