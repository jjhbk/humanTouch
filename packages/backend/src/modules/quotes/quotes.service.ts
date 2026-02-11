import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../../lib/errors.js";
import { isValidQuoteTransition } from "@humanlayer/shared";
import type { QuoteStatus } from "@humanlayer/shared";

export async function requestQuote(
  requesterId: string,
  listingId: string,
  requirements: Record<string, unknown>,
  message?: string
) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new NotFoundError("Listing");
  if (!listing.isActive) throw new ValidationError("Listing is not active");

  const quote = await prisma.quote.create({
    data: {
      listingId,
      requesterId,
      providerId: listing.providerId,
      requirements: requirements as any,
      message,
    },
    include: { listing: true, requester: true, provider: true },
  });

  return quote;
}

export async function respond(
  providerId: string,
  quoteId: string,
  quotedPrice: string,
  estimatedDays: number,
  providerNotes?: string,
  expiresAt?: string
) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new NotFoundError("Quote");
  if (quote.providerId !== providerId) throw new ForbiddenError("Not your quote");

  if (!isValidQuoteTransition(quote.status as QuoteStatus, "RESPONDED")) {
    throw new ValidationError(`Cannot respond to quote in ${quote.status} status`);
  }

  const updated = await prisma.quote.update({
    where: { id: quoteId },
    data: {
      status: "RESPONDED",
      quotedPrice: new (Prisma as any).Decimal(quotedPrice),
      estimatedDays,
      providerNotes,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: { listing: true, requester: true, provider: true },
  });

  return updated;
}

export async function accept(requesterId: string, quoteId: string) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new NotFoundError("Quote");
  if (quote.requesterId !== requesterId) throw new ForbiddenError("Not your quote");

  if (!isValidQuoteTransition(quote.status as QuoteStatus, "ACCEPTED")) {
    throw new ValidationError(`Cannot accept quote in ${quote.status} status`);
  }

  const updated = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "ACCEPTED" },
    include: { listing: true, requester: true, provider: true },
  });

  return updated;
}

export async function reject(requesterId: string, quoteId: string) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new NotFoundError("Quote");
  if (quote.requesterId !== requesterId) throw new ForbiddenError("Not your quote");

  if (!isValidQuoteTransition(quote.status as QuoteStatus, "REJECTED")) {
    throw new ValidationError(`Cannot reject quote in ${quote.status} status`);
  }

  const updated = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "REJECTED" },
    include: { listing: true, requester: true, provider: true },
  });

  return updated;
}

export async function withdraw(requesterId: string, quoteId: string) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new NotFoundError("Quote");
  if (quote.requesterId !== requesterId) throw new ForbiddenError("Not your quote");

  if (!isValidQuoteTransition(quote.status as QuoteStatus, "WITHDRAWN")) {
    throw new ValidationError(`Cannot withdraw quote in ${quote.status} status`);
  }

  const updated = await prisma.quote.update({
    where: { id: quoteId },
    data: { status: "WITHDRAWN" },
    include: { listing: true, requester: true, provider: true },
  });

  return updated;
}

export async function getById(quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          specifications: true,
        },
      },
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  if (!quote) throw new NotFoundError("Quote");
  return quote;
}

export async function listForUser(
  userId: string,
  role: "requester" | "provider",
  status?: string
) {
  const where: any = role === "requester" ? { requesterId: userId } : { providerId: userId };

  // Add status filter if provided
  if (status && status !== "all") {
    where.status = status;
  }

  return prisma.quote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
        },
      },
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}
