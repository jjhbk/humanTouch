import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { prisma } from "../prisma.js";
import { UnauthorizedError, ForbiddenError } from "../errors.js";
import type { UserRole, JwtPayload } from "@humanlayer/shared";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        authMethod: "email" | "wallet" | "apikey";
      };
      apiKey?: {
        id: string;
        label: string;
      };
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers["x-api-key"] as string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new UnauthorizedError("JWT secret not configured");

      const payload = jwt.verify(token, secret) as JwtPayload;
      req.user = {
        id: payload.sub,
        role: payload.role,
        authMethod: payload.authMethod,
      };
      return next();
    }

    if (apiKeyHeader) {
      const keyHash = createHash("sha256").update(apiKeyHeader).digest("hex");
      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: { user: true },
      });

      if (!apiKey) throw new UnauthorizedError("Invalid API key");

      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });

      req.user = {
        id: apiKey.user.id,
        role: apiKey.user.role as UserRole,
        authMethod: "apikey",
      };

      req.apiKey = {
        id: apiKey.id,
        label: apiKey.label,
      };

      return next();
    }

    throw new UnauthorizedError("No authentication provided");
  } catch (err) {
    if (err instanceof UnauthorizedError) return next(err);
    if (err instanceof jwt.JsonWebTokenError) return next(new UnauthorizedError("Invalid token"));
    if (err instanceof jwt.TokenExpiredError) return next(new UnauthorizedError("Token expired"));
    next(err);
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError("Insufficient permissions"));
    }
    next();
  };
}
