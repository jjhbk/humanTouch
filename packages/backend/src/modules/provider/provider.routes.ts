import { Router } from "express";
import * as providerController from "./provider.controller.js";
import { authenticate, requireRole } from "../../lib/middleware/auth.js";
import { validate } from "../../lib/middleware/validate.js";
import { updateProfileSchema } from "./provider.schema.js";

const router = Router();

// Public routes
router.get("/:userId/public", providerController.getPublicProfile);

// Protected provider routes
router.use(authenticate);
router.use(requireRole("PROVIDER", "ADMIN"));

router.get("/dashboard", providerController.getDashboardStats);
router.get("/analytics", providerController.getAnalytics);
router.get("/orders", providerController.getProviderOrders);
router.get("/profile", providerController.getProfile);
router.patch("/profile", validate(updateProfileSchema), providerController.updateProfile);

export default router;
