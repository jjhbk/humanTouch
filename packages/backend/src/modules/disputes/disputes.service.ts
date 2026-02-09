import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ForbiddenError, ConflictError } from "../../lib/errors.js";
import { createNotification } from "../notifications/notifications.service.js";

export async function createDispute(
  orderId: string,
  raisedBy: string,
  reason: string,
  description: string,
) {
  // Check if order exists
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { buyer: true, provider: true },
  });

  if (!order) {
    throw new NotFoundError("Order");
  }

  // Only buyer or provider can raise dispute
  if (order.buyerId !== raisedBy && order.providerId !== raisedBy) {
    throw new ForbiddenError("You are not a participant of this order");
  }

  // Check if dispute already exists
  const existingDispute = await prisma.dispute.findUnique({
    where: { orderId },
  });

  if (existingDispute) {
    throw new ConflictError("A dispute already exists for this order");
  }

  // Create dispute
  const dispute = await prisma.dispute.create({
    data: {
      orderId,
      raisedBy,
      reason,
      description,
    },
  });

  // Update order status to DISPUTED
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "DISPUTED" },
  });

  // Create status log
  await prisma.orderStatusLog.create({
    data: {
      orderId,
      fromStatus: order.status,
      toStatus: "DISPUTED",
      changedBy: raisedBy,
      reason: `Dispute raised: ${reason}`,
    },
  });

  // Notify both parties
  const otherPartyId = raisedBy === order.buyerId ? order.providerId : order.buyerId;
  await Promise.all([
    createNotification(
      raisedBy,
      "DISPUTE_OPENED",
      "Dispute Submitted",
      "Your dispute has been submitted and is under review.",
      orderId,
    ),
    createNotification(
      otherPartyId,
      "DISPUTE_OPENED",
      "Dispute Opened",
      "A dispute has been opened for this order. An admin will review it.",
      orderId,
    ),
  ]);

  return dispute;
}

export async function getDispute(disputeId: string, userId: string, userRole: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      order: {
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          provider: { select: { id: true, name: true, email: true } },
        },
      },
      raiser: { select: { id: true, name: true, email: true } },
      resolver: { select: { id: true, name: true, email: true } },
    },
  });

  if (!dispute) {
    throw new NotFoundError("Dispute");
  }

  // Only participants or admins can view dispute
  if (
    userRole !== "ADMIN" &&
    dispute.order.buyerId !== userId &&
    dispute.order.providerId !== userId
  ) {
    throw new ForbiddenError("You cannot view this dispute");
  }

  return dispute;
}

export async function getOrderDispute(orderId: string, userId: string, userRole: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError("Order");
  }

  // Check access
  if (userRole !== "ADMIN" && order.buyerId !== userId && order.providerId !== userId) {
    throw new ForbiddenError("You cannot view this order");
  }

  const dispute = await prisma.dispute.findUnique({
    where: { orderId },
    include: {
      raiser: { select: { id: true, name: true, email: true } },
      resolver: { select: { id: true, name: true, email: true } },
    },
  });

  return dispute;
}

export async function getAllDisputes(status?: string) {
  return prisma.dispute.findMany({
    where: status ? { status } : undefined,
    include: {
      order: {
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          provider: { select: { id: true, name: true, email: true } },
        },
      },
      raiser: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveDispute(
  disputeId: string,
  resolvedBy: string,
  resolution: string,
  newOrderStatus: "COMPLETED" | "REFUNDED" | "CANCELLED",
) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { order: true },
  });

  if (!dispute) {
    throw new NotFoundError("Dispute");
  }

  if (dispute.status !== "OPEN" && dispute.status !== "UNDER_REVIEW") {
    throw new ConflictError("Dispute is already resolved");
  }

  // Update dispute
  const updatedDispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: "RESOLVED",
      resolution,
      resolvedBy,
      resolvedAt: new Date(),
    },
  });

  // Update order status
  await prisma.order.update({
    where: { id: dispute.orderId },
    data: { status: newOrderStatus },
  });

  // Create status log
  await prisma.orderStatusLog.create({
    data: {
      orderId: dispute.orderId,
      fromStatus: "DISPUTED",
      toStatus: newOrderStatus,
      changedBy: resolvedBy,
      reason: `Dispute resolved: ${resolution}`,
    },
  });

  // Notify both parties
  await Promise.all([
    createNotification(
      dispute.order.buyerId,
      "DISPUTE_RESOLVED",
      "Dispute Resolved",
      `The dispute has been resolved. New order status: ${newOrderStatus}`,
      dispute.orderId,
    ),
    createNotification(
      dispute.order.providerId,
      "DISPUTE_RESOLVED",
      "Dispute Resolved",
      `The dispute has been resolved. New order status: ${newOrderStatus}`,
      dispute.orderId,
    ),
  ]);

  return updatedDispute;
}

export async function updateDisputeStatus(disputeId: string, status: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
  });

  if (!dispute) {
    throw new NotFoundError("Dispute");
  }

  return prisma.dispute.update({
    where: { id: disputeId },
    data: { status },
  });
}

export async function addComment(
  disputeId: string,
  userId: string,
  userRole: string,
  comment: string,
) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { order: true },
  });

  if (!dispute) {
    throw new NotFoundError("Dispute");
  }

  // Check access: must be admin, buyer, or provider
  if (
    userRole !== "ADMIN" &&
    dispute.order.buyerId !== userId &&
    dispute.order.providerId !== userId
  ) {
    throw new ForbiddenError("You cannot comment on this dispute");
  }

  const disputeComment = await prisma.disputeComment.create({
    data: {
      disputeId,
      userId,
      comment,
      isAdmin: userRole === "ADMIN",
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  // Notify all parties except the commenter
  const notifyUserIds = [dispute.order.buyerId, dispute.order.providerId].filter(
    (id) => id !== userId,
  );

  await Promise.all(
    notifyUserIds.map((notifyUserId) =>
      createNotification(
        notifyUserId,
        "DISPUTE_OPENED",
        "New Dispute Comment",
        userRole === "ADMIN"
          ? "Admin added a comment to the dispute"
          : "New comment added to dispute",
        dispute.orderId,
      ),
    ),
  );

  return disputeComment;
}

export async function getComments(disputeId: string, userId: string, userRole: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { order: true },
  });

  if (!dispute) {
    throw new NotFoundError("Dispute");
  }

  // Check access
  if (
    userRole !== "ADMIN" &&
    dispute.order.buyerId !== userId &&
    dispute.order.providerId !== userId
  ) {
    throw new ForbiddenError("You cannot view comments for this dispute");
  }

  return prisma.disputeComment.findMany({
    where: { disputeId },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
