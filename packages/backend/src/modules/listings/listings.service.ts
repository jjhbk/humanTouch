import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../lib/errors.js";
import { slugify, clampPagination, validateSpecifications } from "@humanlayer/shared";
import type { ListingSearchQuery } from "@humanlayer/shared";

export async function create(providerId: string, data: {
  title: string;
  description: string;
  category: string;
  pricingModel: string;
  basePrice: string;
  currency?: string;
  specifications?: Record<string, unknown>;
  tags?: string[];
  availableSlots?: number;
}) {
  // Validate specifications against category template
  if (data.specifications && Object.keys(data.specifications).length > 0) {
    const validation = validateSpecifications(data.category, data.specifications);
    if (!validation.valid) {
      throw new ValidationError(`Specification validation failed: ${validation.errors.join(", ")}`);
    }
  }

  let slug = slugify(data.title);

  const existingSlug = await prisma.listing.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const listing = await prisma.listing.create({
    data: {
      providerId,
      title: data.title,
      slug,
      description: data.description,
      category: data.category,
      pricingModel: data.pricingModel,
      basePrice: new Prisma.Decimal(data.basePrice),
      currency: data.currency ?? "USDC",
      specifications: (data.specifications ?? {}) as Prisma.InputJsonValue,
      tags: data.tags ?? [],
      availableSlots: data.availableSlots ?? 1,
    },
    include: { provider: { include: { providerProfile: true } } },
  });

  return listing;
}

export async function update(providerId: string, listingId: string, data: Record<string, unknown>) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new NotFoundError("Listing");
  if (listing.providerId !== providerId) throw new ForbiddenError("Not your listing");

  // Validate specifications if provided
  if (data.specifications && typeof data.specifications === 'object') {
    const category = (data.category as string) || listing.category;
    const validation = validateSpecifications(category, data.specifications as Record<string, any>);
    if (!validation.valid) {
      throw new ValidationError(`Specification validation failed: ${validation.errors.join(", ")}`);
    }
  }

  const updateData: Record<string, unknown> = { ...data };
  if (data.basePrice) {
    updateData.basePrice = new Prisma.Decimal(data.basePrice as string);
  }
  if (data.title) {
    let slug = slugify(data.title as string);
    const existingSlug = await prisma.listing.findFirst({ where: { slug, id: { not: listingId } } });
    if (existingSlug) slug = `${slug}-${Date.now().toString(36)}`;
    updateData.slug = slug;
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: updateData,
    include: { provider: { include: { providerProfile: true } } },
  });

  return updated;
}

export async function remove(providerId: string, listingId: string) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new NotFoundError("Listing");
  if (listing.providerId !== providerId) throw new ForbiddenError("Not your listing");

  await prisma.listing.update({
    where: { id: listingId },
    data: { isActive: false },
  });
}

export async function getByIdOrSlug(idOrSlug: string) {
  const listing = await prisma.listing.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      provider: {
        include: { providerProfile: true },
      },
    },
  });

  if (!listing) throw new NotFoundError("Listing");
  return listing;
}

export async function search(query: ListingSearchQuery) {
  const { page, limit, skip } = clampPagination(query.page, query.limit);

  const where: Prisma.ListingWhereInput = { isActive: true };

  if (query.category) where.category = query.category;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.basePrice = {};
    if (query.minPrice !== undefined) where.basePrice.gte = new Prisma.Decimal(query.minPrice);
    if (query.maxPrice !== undefined) where.basePrice.lte = new Prisma.Decimal(query.maxPrice);
  }
  if (query.tags && query.tags.length > 0) {
    where.tags = { hasSome: query.tags };
  }
  if (query.minRating !== undefined) {
    where.averageRating = { gte: query.minRating };
  }
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: "desc" };
  switch (query.sortBy) {
    case "price_asc":
      orderBy = { basePrice: "asc" };
      break;
    case "price_desc":
      orderBy = { basePrice: "desc" };
      break;
    case "rating":
      orderBy = { averageRating: "desc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: { provider: { include: { providerProfile: true } } },
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    listings,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getByProvider(providerId: string) {
  return prisma.listing.findMany({
    where: { providerId },
    orderBy: { createdAt: "desc" },
    include: { provider: { include: { providerProfile: true } } },
  });
}
