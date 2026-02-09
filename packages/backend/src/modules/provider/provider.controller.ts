import type { Request, Response, NextFunction } from "express";
import * as providerService from "./provider.service.js";

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await providerService.getDashboardStats(req.user!.id);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { businessName, description, websiteUrl } = req.body;
    const profile = await providerService.updateProfile(req.user!.id, {
      businessName,
      description,
      websiteUrl,
    });
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const analytics = await providerService.getAnalytics(req.user!.id, days);
    res.json({ success: true, data: analytics });
  } catch (err) {
    next(err);
  }
}

export async function getProviderOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await providerService.getProviderOrders(req.user!.id, {
      status,
      limit,
      offset,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await providerService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function getPublicProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = req.params;
    const profile = await providerService.getPublicProfile(userId);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}
