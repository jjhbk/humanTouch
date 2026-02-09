import { Router } from "express";
import * as listingsController from "./listings.controller.js";
import { authenticate, requireRole } from "../../lib/middleware/auth.js";
import { validate } from "../../lib/middleware/validate.js";
import { createListingSchema, updateListingSchema, searchListingsSchema } from "./listings.schema.js";

const router = Router();

// Public routes
router.get("/", validate(searchListingsSchema, "query"), listingsController.search);
router.get("/:idOrSlug", listingsController.getOne);
router.get("/:idOrSlug/reviews", listingsController.getReviews);

// Protected routes
router.get("/mine", authenticate, requireRole("PROVIDER", "ADMIN"), listingsController.getMyListings);
router.post("/", authenticate, requireRole("PROVIDER", "ADMIN"), validate(createListingSchema), listingsController.create);
router.patch("/:id", authenticate, requireRole("PROVIDER", "ADMIN"), validate(updateListingSchema), listingsController.update);
router.delete("/:id", authenticate, requireRole("PROVIDER", "ADMIN"), listingsController.remove);

export default router;
