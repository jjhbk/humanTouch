import type { Request, Response, NextFunction } from "express";
import * as reviewsService from "./reviews.service.js";

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId, rating, comment } = req.body;
    const review = await reviewsService.submit(req.user!.id, orderId, rating, comment);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reviewsService.list(req.query as { listingId?: string; providerId?: string; page?: number; limit?: number });
    res.json({ success: true, data: result.reviews, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function reply(req: Request, res: Response, next: NextFunction) {
  try {
    const { reply: replyText } = req.body;
    const review = await reviewsService.reply(req.user!.id, req.params.id, replyText);
    res.json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
}
