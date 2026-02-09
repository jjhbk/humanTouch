import { prisma } from "../../lib/prisma.js";

export type NotificationType =
  | "ORDER_STATUS_CHANGED"
  | "NEW_MESSAGE"
  | "DISPUTE_OPENED"
  | "DISPUTE_RESOLVED"
  | "REVIEW_RECEIVED";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  orderId?: string,
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      orderId,
    },
  });
}

export async function getUserNotifications(
  userId: string,
  unreadOnly: boolean = false,
  limit: number = 50,
) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { isRead: false }),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

export async function markAsRead(userId: string, notificationIds: string[]) {
  return prisma.notification.updateMany({
    where: {
      id: { in: notificationIds },
      userId, // Security: only mark own notifications
    },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

// Helper: Notify both parties about order status change
export async function notifyOrderStatusChange(
  orderId: string,
  buyerId: string,
  providerId: string,
  fromStatus: string | null,
  toStatus: string,
) {
  const statusMessages: Record<string, { buyer: string; provider: string }> = {
    CONFIRMED: {
      buyer: "Your payment has been secured in escrow.",
      provider: "Buyer has deposited payment. You can start work.",
    },
    IN_PROGRESS: {
      buyer: "Provider has started working on your order.",
      provider: "You've marked this order as in progress.",
    },
    DELIVERED: {
      buyer: "Provider has delivered the work. Please review and mark as complete.",
      provider: "You've marked this order as delivered. Waiting for buyer approval.",
    },
    COMPLETED: {
      buyer: "You've marked this order as complete. Payment released to provider.",
      provider: "Buyer has accepted the work. Payment has been released!",
    },
    DISPUTED: {
      buyer: "A dispute has been opened for this order.",
      provider: "A dispute has been opened for this order.",
    },
  };

  const messages = statusMessages[toStatus];
  if (!messages) return;

  await Promise.all([
    createNotification(
      buyerId,
      "ORDER_STATUS_CHANGED",
      `Order Status: ${toStatus}`,
      messages.buyer,
      orderId,
    ),
    createNotification(
      providerId,
      "ORDER_STATUS_CHANGED",
      `Order Status: ${toStatus}`,
      messages.provider,
      orderId,
    ),
  ]);
}
