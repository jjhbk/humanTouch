import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ForbiddenError } from "../../lib/errors.js";

export async function sendMessage(senderId: string, orderId: string, content: string) {
  // Verify order exists and sender is a participant
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new NotFoundError("Order");

  if (order.buyerId !== senderId && order.providerId !== senderId) {
    throw new ForbiddenError("You are not a participant of this order");
  }

  const message = await prisma.message.create({
    data: {
      orderId,
      senderId,
      content,
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return message;
}

export async function getOrderMessages(userId: string, orderId: string, limit = 50, offset = 0) {
  // Verify user is a participant
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new NotFoundError("Order");

  if (order.buyerId !== userId && order.providerId !== userId) {
    throw new ForbiddenError("You are not a participant of this order");
  }

  const [messages, total, unreadCount] = await Promise.all([
    prisma.message.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.message.count({ where: { orderId } }),
    prisma.message.count({
      where: {
        orderId,
        senderId: { not: userId },
        isRead: false,
      },
    }),
  ]);

  return {
    messages: messages.reverse(), // Show oldest first
    total,
    unreadCount,
  };
}

export async function markAsRead(userId: string, messageIds: string[]) {
  // Only mark messages as read if the user is the recipient (not the sender)
  const updated = await prisma.message.updateMany({
    where: {
      id: { in: messageIds },
      senderId: { not: userId },
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return { count: updated.count };
}

export async function getUnreadCount(userId: string) {
  const count = await prisma.message.count({
    where: {
      senderId: { not: userId },
      isRead: false,
      order: {
        OR: [{ buyerId: userId }, { providerId: userId }],
      },
    },
  });

  return count;
}
