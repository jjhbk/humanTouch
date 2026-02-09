import type { Request, Response, NextFunction } from "express";
import * as quotesService from "./quotes.service.js";

export async function requestQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const { listingId, requirements, message } = req.body;
    const quote = await quotesService.requestQuote(req.user!.id, listingId, requirements, message);
    res.status(201).json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
}

export async function respond(req: Request, res: Response, next: NextFunction) {
  try {
    const { quotedPrice, estimatedDays, providerNotes, expiresAt } = req.body;
    const quote = await quotesService.respond(req.user!.id, req.params.id, quotedPrice, estimatedDays, providerNotes, expiresAt);
    res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
}

export async function accept(req: Request, res: Response, next: NextFunction) {
  try {
    const quote = await quotesService.accept(req.user!.id, req.params.id);
    res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction) {
  try {
    const quote = await quotesService.reject(req.user!.id, req.params.id);
    res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
}

export async function withdraw(req: Request, res: Response, next: NextFunction) {
  try {
    const quote = await quotesService.withdraw(req.user!.id, req.params.id);
    res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const quote = await quotesService.getById(req.params.id);
    res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
}

export async function listMyQuotes(req: Request, res: Response, next: NextFunction) {
  try {
    // Auto-detect role from user's actual role, but allow override via query param
    let role: "requester" | "provider";
    if (req.query.role === "provider" || req.query.role === "requester") {
      role = req.query.role as "requester" | "provider";
    } else {
      // Default: providers see their provider quotes, everyone else sees requester quotes
      role = req.user!.role === "PROVIDER" || req.user!.role === "ADMIN" ? "provider" : "requester";
    }

    const status = req.query.status as string | undefined;
    const quotes = await quotesService.listForUser(req.user!.id, role, status);
    res.json({ success: true, data: quotes });
  } catch (err) {
    next(err);
  }
}
