import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";

// Combined endpoint for notifications and message counts
export async function getActivitySummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const orderId = req.query.orderId as string | undefined;

    // Run queries in parallel for performance
    const [unreadNotifications, unreadMessageCount, latestNotification] = await Promise.all([
      // Get unread notification count
      prisma.notification.count({
        where: { userId, isRead: false },
      }),

      // Get unread message count (only for specific order if provided)
      orderId
        ? prisma.message.count({
            where: {
              orderId,
              isRead: false,
              senderId: { not: userId },
            },
          })
        : Promise.resolve(0),

      // Get latest notification ID to check if new ones arrived
      prisma.notification.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        unreadNotifications,
        unreadMessages: unreadMessageCount,
        latestNotificationId: latestNotification?.id || null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get new items since last check (more efficient than fetching all)
export async function getNewActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const since = req.query.since as string | undefined; // ISO timestamp
    const orderId = req.query.orderId as string | undefined;

    if (!since) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: "since parameter is required" },
      });
    }

    const sinceDate = new Date(since);

    const [newNotifications, newMessages] = await Promise.all([
      // Get new notifications
      prisma.notification.findMany({
        where: {
          userId,
          createdAt: { gt: sinceDate },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),

      // Get new messages (only for specific order if provided)
      orderId
        ? prisma.message.findMany({
            where: {
              orderId,
              createdAt: { gt: sinceDate },
              senderId: { not: userId },
            },
            include: {
              sender: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: "asc" },
          })
        : Promise.resolve([]),
    ]);

    res.json({
      success: true,
      data: {
        notifications: newNotifications,
        messages: newMessages,
        hasNew: newNotifications.length > 0 || newMessages.length > 0,
      },
    });
  } catch (error) {
    next(error);
  }
}
