import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from "../../lib/errors.js";
import { clampPagination } from "@humanlayer/shared";

export async function submit(reviewerId: string, orderId: string, rating: number, comment?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");
  if (order.status !== "COMPLETED") throw new ValidationError("Can only review completed orders");
  if (order.buyerId !== reviewerId) throw new ForbiddenError("Only the buyer can review");

  const existing = await prisma.review.findUnique({ where: { orderId } });
  if (existing) throw new ConflictError("Review already exists for this order");

  const review = await prisma.review.create({
    data: {
      orderId,
      reviewerId,
      providerId: order.providerId,
      listingId: order.listingId,
      rating,
      comment,
    },
    include: { reviewer: true, order: true },
  });

  // Update listing stats
  const listingStats = await prisma.review.aggregate({
    where: { listingId: order.listingId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.listing.update({
    where: { id: order.listingId },
    data: {
      averageRating: listingStats._avg.rating,
      totalReviews: listingStats._count.rating,
    },
  });

  // Update provider profile stats
  const providerStats = await prisma.review.aggregate({
    where: { providerId: order.providerId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.providerProfile.updateMany({
    where: { userId: order.providerId },
    data: {
      averageRating: providerStats._avg.rating,
      totalReviews: providerStats._count.rating,
    },
  });

  return review;
}

export async function list(filters: { listingId?: string; providerId?: string; page?: number; limit?: number }) {
  const { page, limit, skip } = clampPagination(filters.page, filters.limit);

  const where: Record<string, unknown> = {};
  if (filters.listingId) where.listingId = filters.listingId;
  if (filters.providerId) where.providerId = filters.providerId;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { reviewer: true, order: true },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    reviews,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function reply(providerId: string, reviewId: string, replyText: string) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new NotFoundError("Review");
  if (review.providerId !== providerId) throw new ForbiddenError("Not your review to reply to");

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      providerReply: replyText,
      providerRepliedAt: new Date(),
    },
    include: { reviewer: true, order: true },
  });

  return updated;
}
