import type { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;
    const result = await authService.register(email, password, name);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    res.json({ success: true, data: tokens });
  } catch (err) {
    next(err);
  }
}

export async function generateNonce(req: Request, res: Response, next: NextFunction) {
  try {
    const { walletAddress } = req.body;
    const nonce = await authService.generateNonce(walletAddress);
    res.json({ success: true, data: { nonce } });
  } catch (err) {
    next(err);
  }
}

export async function verifyWallet(req: Request, res: Response, next: NextFunction) {
  try {
    const { message, signature } = req.body;
    const result = await authService.verifyWallet(message, signature);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function createApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const { label, permissions } = req.body;
    const result = await authService.createApiKey(req.user!.id, label, permissions);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function listApiKeys(req: Request, res: Response, next: NextFunction) {
  try {
    const keys = await authService.listApiKeys(req.user!.id);
    res.json({ success: true, data: keys });
  } catch (err) {
    next(err);
  }
}

export async function revokeApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.revokeApiKey(req.user!.id, req.params.keyId);
    res.json({ success: true, data: { message: "API key revoked" } });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const { walletAddress, name } = req.body;
    const user = await authService.updateMe(req.user!.id, { walletAddress, name });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

export async function becomeProvider(req: Request, res: Response, next: NextFunction) {
  try {
    const { businessName, description, websiteUrl } = req.body;
    const result = await authService.becomeProvider(req.user!.id, businessName, description, websiteUrl);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
