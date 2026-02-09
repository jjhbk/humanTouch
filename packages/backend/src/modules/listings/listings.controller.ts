import type { Request, Response, NextFunction } from "express";
import * as listingsService from "./listings.service.js";
import * as reviewsService from "../reviews/reviews.service.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await listingsService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await listingsService.update(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await listingsService.remove(req.user!.id, req.params.id);
    res.json({ success: true, data: { message: "Listing deactivated" } });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const listing = await listingsService.getByIdOrSlug(req.params.idOrSlug);
    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
}

export async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await listingsService.search(req.query as never);
    res.json({ success: true, data: result.listings, meta: result.meta });
  } catch (err) {
    next(err);
  }
}

export async function getMyListings(req: Request, res: Response, next: NextFunction) {
  try {
    const listings = await listingsService.getByProvider(req.user!.id);
    res.json({ success: true, data: listings });
  } catch (err) {
    next(err);
  }
}

export async function getReviews(req: Request, res: Response, next: NextFunction) {
  try {
    // First get the listing to ensure it exists and get its ID
    const listing = await listingsService.getByIdOrSlug(req.params.idOrSlug);

    // Then get reviews for this listing
    const result = await reviewsService.list({
      listingId: listing.id,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });

    res.json({ success: true, data: result.reviews, meta: result.meta });
  } catch (err) {
    next(err);
  }
}
