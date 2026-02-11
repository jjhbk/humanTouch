import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../lib/errors.js";
import { isValidOrderTransition, generateOrderNumber } from "@humanlayer/shared";
import type { OrderStatus } from "@humanlayer/shared";
import { notifyOrderStatusChange } from "../notifications/notifications.service.js";

async function transition(
  userId: string,
  orderId: string,
  toStatus: OrderStatus,
  reason?: string,
  extra?: Record<string, unknown>
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");

  const fromStatus = order.status as OrderStatus;
  if (!isValidOrderTransition(fromStatus, toStatus)) {
    throw new ValidationError(`Cannot transition from ${fromStatus} to ${toStatus}`);
  }

  const updateData: Record<string, unknown> = { status: toStatus, ...extra };
  if (toStatus === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  const [updated] = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: { quote: true, listing: true, buyer: true, provider: true, statusLogs: true },
    }),
    prisma.orderStatusLog.create({
      data: {
        orderId,
        fromStatus,
        toStatus,
        changedBy: userId,
        reason,
      },
    }),
  ]);

  // Send notifications to both parties about status change
  await notifyOrderStatusChange(orderId, updated.buyerId, updated.providerId, fromStatus, toStatus);

  return updated;
}

export async function create(buyerId: string, quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { listing: true },
  });
  if (!quote) throw new NotFoundError("Quote");
  if (quote.requesterId !== buyerId) throw new ForbiddenError("Not your quote");
  if (quote.status !== "ACCEPTED") throw new ValidationError("Quote must be accepted");
  if (!quote.quotedPrice) throw new ValidationError("Quote has no price");

  const orderCount = await prisma.order.count();
  const orderNumber = generateOrderNumber(orderCount + 1);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      quoteId: quote.id,
      buyerId,
      providerId: quote.providerId,
      listingId: quote.listingId,
      amount: quote.quotedPrice,
      status: "PENDING",
    },
    include: { quote: true, listing: true, buyer: true, provider: true, statusLogs: true },
  });

  await prisma.orderStatusLog.create({
    data: {
      orderId: order.id,
      fromStatus: null,
      toStatus: "PENDING",
      changedBy: buyerId,
    },
  });

  return order;
}

export async function confirm(userId: string, orderId: string, reason?: string, escrowTxHash?: string, escrowId?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");

  // If already confirmed, just update escrow details without state transition
  if (order.status === "CONFIRMED") {
    const updateData: Record<string, unknown> = {};
    if (escrowTxHash && !order.escrowTxHash) updateData.escrowTxHash = escrowTxHash;
    if (escrowId && !order.escrowId) updateData.escrowId = escrowId;

    // Only update if there's new data
    if (Object.keys(updateData).length > 0) {
      return prisma.order.update({
        where: { id: orderId },
        data: updateData,
      });
    }

    // No updates needed, return existing order
    return order;
  }

  // Normal transition for non-confirmed orders
  const extra: Record<string, unknown> = {};
  if (escrowTxHash) extra.escrowTxHash = escrowTxHash;
  if (escrowId) extra.escrowId = escrowId;

  return transition(userId, orderId, "CONFIRMED", reason, extra);
}

export async function start(userId: string, orderId: string, reason?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");
  if (order.providerId !== userId) throw new ForbiddenError("Only provider can start");
  return transition(userId, orderId, "IN_PROGRESS", reason);
}

export async function deliver(userId: string, orderId: string, deliverables: Record<string, unknown>, reason?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");
  if (order.providerId !== userId) throw new ForbiddenError("Only provider can deliver");
  return transition(userId, orderId, "DELIVERED", reason, { deliverables });
}

export async function complete(userId: string, orderId: string, reason?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");
  if (order.buyerId !== userId) throw new ForbiddenError("Only buyer can complete");
  return transition(userId, orderId, "COMPLETED", reason);
}

export async function releaseEscrow(userId: string, orderId: string, releaseTxHash?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");
  if (order.buyerId !== userId) throw new ForbiddenError("Only buyer can release escrow");

  // Can release from CONFIRMED, IN_PROGRESS, or DELIVERED status
  if (!["CONFIRMED", "IN_PROGRESS", "DELIVERED"].includes(order.status)) {
    throw new ValidationError("Cannot release escrow from current status");
  }

  return transition(userId, orderId, "COMPLETED", `Manual escrow release. Tx: ${releaseTxHash || "N/A"}`);
}

export async function dispute(userId: string, orderId: string, reason?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");
  if (order.buyerId !== userId && order.providerId !== userId) {
    throw new ForbiddenError("Not a participant of this order");
  }
  return transition(userId, orderId, "DISPUTED", reason);
}

export async function cancel(userId: string, orderId: string, reason?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");
  if (order.buyerId !== userId && order.providerId !== userId) {
    throw new ForbiddenError("Not a participant of this order");
  }
  return transition(userId, orderId, "CANCELLED", reason);
}

export async function getById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      quote: true,
      listing: true,
      buyer: true,
      provider: true,
      statusLogs: { orderBy: { createdAt: "asc" } },
      transactions: true,
      review: true,
    },
  });
  if (!order) throw new NotFoundError("Order");
  return order;
}

export async function listForUser(userId: string, role: "buyer" | "provider") {
  const where = role === "buyer" ? { buyerId: userId } : { providerId: userId };
  return prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { quote: true, listing: true, buyer: true, provider: true, statusLogs: true },
  });
}

export async function getStatusLogs(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");

  const logs = await prisma.orderStatusLog.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });

  return logs;
}
