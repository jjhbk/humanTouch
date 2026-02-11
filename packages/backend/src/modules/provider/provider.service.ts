import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ForbiddenError } from "../../lib/errors.js";

/**
 * Get provider dashboard statistics
 */
export async function getDashboardStats(userId: string) {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
  });

  if (!profile) throw new NotFoundError("Provider profile");

  // Get total listings
  const totalListings = await prisma.listing.count({
    where: { providerId: userId },
  });

  // Get active listings
  const activeListings = await prisma.listing.count({
    where: { providerId: userId, isActive: true },
  });

  // Get orders stats
  const [totalOrders, activeOrders, completedOrders] = await Promise.all([
    prisma.order.count({
      where: { providerId: userId },
    }),
    prisma.order.count({
      where: {
        providerId: userId,
        status: { in: ["CONFIRMED", "IN_PROGRESS", "DELIVERED"] },
      },
    }),
    prisma.order.count({
      where: { providerId: userId, status: "COMPLETED" },
    }),
  ]);

  // Calculate total revenue (from completed orders)
  const revenueData = await prisma.order.aggregate({
    where: {
      providerId: userId,
      status: "COMPLETED",
    },
    _sum: {
      amount: true,
    },
  });

  const totalRevenue = revenueData._sum.amount?.toString() || "0";

  // Get pending quotes count
  const pendingQuotes = await prisma.quote.count({
    where: {
      providerId: userId,
      status: "PENDING",
    },
  });

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    where: { providerId: userId },
    include: {
      listing: { select: { title: true } },
      buyer: { select: { name: true, email: true, walletAddress: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    profile: {
      businessName: profile.businessName,
      averageRating: profile.averageRating,
      totalReviews: profile.totalReviews,
      verificationStatus: profile.verificationStatus,
      stakeAmount: profile.stakeAmount.toString(),
    },
    stats: {
      totalListings,
      activeListings,
      totalOrders,
      activeOrders,
      completedOrders,
      totalRevenue,
      pendingQuotes,
    },
    recentOrders: recentOrders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      amount: order.amount.toString(),
      listingTitle: order.listing.title,
      buyerName: order.buyer.name || order.buyer.email || order.buyer.walletAddress,
      createdAt: order.createdAt,
    })),
  };
}

/**
 * Update provider profile
 */
export async function updateProfile(
  userId: string,
  data: {
    businessName?: string;
    description?: string;
    websiteUrl?: string;
  }
) {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
  });

  if (!profile) throw new NotFoundError("Provider profile");

  const updated = await prisma.providerProfile.update({
    where: { userId },
    data: {
      ...(data.businessName && { businessName: data.businessName }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.websiteUrl !== undefined && { websiteUrl: data.websiteUrl }),
    },
  });

  return {
    id: updated.id,
    businessName: updated.businessName,
    description: updated.description,
    websiteUrl: updated.websiteUrl,
    verificationStatus: updated.verificationStatus,
    stakeAmount: updated.stakeAmount.toString(),
    averageRating: updated.averageRating,
    totalReviews: updated.totalReviews,
  };
}

/**
 * Get provider analytics
 */
export async function getAnalytics(userId: string, days: number = 30) {
  const profile = await prisma.providerProfile.findUnique({
    where: { userId },
  });

  if (!profile) throw new NotFoundError("Provider profile");

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Orders over time
  const orders = await prisma.order.findMany({
    where: {
      providerId: userId,
      createdAt: { gte: since },
    },
    select: {
      createdAt: true,
      amount: true,
      status: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Quote conversion rate
  const quotesRequested = await prisma.quote.count({
    where: {
      providerId: userId,
      createdAt: { gte: since },
    },
  });

  const quotesAccepted = await prisma.quote.count({
    where: {
      providerId: userId,
      status: "ACCEPTED",
      createdAt: { gte: since },
    },
  });

  const conversionRate = quotesRequested > 0
    ? ((quotesAccepted / quotesRequested) * 100).toFixed(2)
    : "0";

  // Top performing listings
  const topListings = await prisma.listing.findMany({
    where: { providerId: userId },
    include: {
      _count: {
        select: { orders: true },
      },
    },
    orderBy: {
      orders: {
        _count: "desc",
      },
    },
    take: 5,
  });

  return {
    period: `${days} days`,
    orders: {
      total: orders.length,
      byStatus: {
        completed: orders.filter((o: any) => o.status === "COMPLETED").length,
        inProgress: orders.filter((o: any) =>
          ["CONFIRMED", "IN_PROGRESS", "DELIVERED"].includes(o.status)
        ).length,
        cancelled: orders.filter((o: any) =>
          ["CANCELLED", "REFUNDED"].includes(o.status)
        ).length,
      },
    },
    quotes: {
      total: quotesRequested,
      accepted: quotesAccepted,
      conversionRate: `${conversionRate}%`,
    },
    topListings: topListings.map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      orderCount: listing._count.orders,
      averageRating: listing.averageRating,
    })),
  };
}

/**
 * Get provider orders with filters
 */
export async function getProviderOrders(
  userId: string,
  filters: { status?: string; limit?: number; offset?: number }
) {
  const { status, limit = 20, offset = 0 } = filters;

  const where: any = { providerId: userId };
  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        listing: { select: { title: true } },
        buyer: { select: { name: true, email: true, walletAddress: true } },
        quote: { select: { requirements: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      amount: order.amount.toString(),
      listingTitle: order.listing.title,
      buyerName: order.buyer.name || order.buyer.email || order.buyer.walletAddress,
      requirements: order.quote.requirements,
      deliverables: order.deliverables,
      createdAt: order.createdAt,
      completedAt: order.completedAt,
    })),
    total,
  };
}

/**
 * Get provider profile (for self-viewing)
 */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { providerProfile: true },
  });

  if (!user || !user.providerProfile) {
    throw new NotFoundError("Provider profile");
  }

  return {
    id: user.providerProfile.id,
    businessName: user.providerProfile.businessName,
    description: user.providerProfile.description,
    websiteUrl: user.providerProfile.websiteUrl,
    verificationStatus: user.providerProfile.verificationStatus,
    stakeAmount: user.providerProfile.stakeAmount.toString(),
    averageRating: user.providerProfile.averageRating,
    totalReviews: user.providerProfile.totalReviews,
    totalOrders: user.providerProfile.totalOrders,
    createdAt: user.providerProfile.createdAt,
  };
}

/**
 * Get provider public profile (for buyers to view)
 */
export async function getPublicProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      providerProfile: true,
      listings: {
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          basePrice: true,
          averageRating: true,
        },
      },
    },
  });

  if (!user || !user.providerProfile) {
    throw new NotFoundError("Provider");
  }

  return {
    id: user.id,
    name: user.name,
    profile: {
      businessName: user.providerProfile.businessName,
      description: user.providerProfile.description,
      websiteUrl: user.providerProfile.websiteUrl,
      verificationStatus: user.providerProfile.verificationStatus,
      averageRating: user.providerProfile.averageRating,
      totalReviews: user.providerProfile.totalReviews,
      totalOrders: user.providerProfile.totalOrders,
    },
    listings: user.listings.map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      category: listing.category,
      basePrice: listing.basePrice.toString(),
      averageRating: listing.averageRating,
    })),
  };
}
