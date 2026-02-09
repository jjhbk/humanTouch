import type { Request, Response, NextFunction } from "express";
import * as notificationsService from "./notifications.service.js";

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const unreadOnly = req.query.unreadOnly === "true";
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const notifications = await notificationsService.getUserNotifications(userId, unreadOnly, limit);

    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const count = await notificationsService.getUnreadCount(userId);

    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { notificationIds, markAll } = req.body;

    console.log("Mark as read request:", { userId, notificationIds, markAll });

    if (markAll) {
      await notificationsService.markAllAsRead(userId);
    } else if (notificationIds && notificationIds.length > 0) {
      await notificationsService.markAsRead(userId, notificationIds);
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "Either notificationIds or markAll must be provided"
        }
      });
    }

    res.json({ success: true, data: { message: "Marked as read" } });
  } catch (error) {
    next(error);
  }
}
