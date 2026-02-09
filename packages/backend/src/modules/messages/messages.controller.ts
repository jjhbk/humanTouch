import type { Request, Response, NextFunction } from "express";
import * as messagesService from "./messages.service.js";

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId, content } = req.body;
    const message = await messagesService.sendMessage(req.user!.id, orderId, content);
    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
}

export async function getOrderMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const result = await messagesService.getOrderMessages(req.user!.id, orderId, limit, offset);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { messageIds } = req.body;
    const result = await messagesService.markAsRead(req.user!.id, messageIds);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const count = await messagesService.getUnreadCount(req.user!.id);
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
}
