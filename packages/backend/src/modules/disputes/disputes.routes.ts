import { Router } from "express";
import * as disputesController from "./disputes.controller.js";
import { authenticate, requireRole } from "../../lib/middleware/auth.js";
import { validate } from "../../lib/middleware/validate.js";
import {
  createDisputeSchema,
  resolveDisputeSchema,
  updateDisputeStatusSchema,
  addCommentSchema,
} from "./disputes.schema.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create dispute (buyer or provider) - validation handled in controller
router.post("/", disputesController.createDispute);

// Get dispute by ID
router.get("/:id", disputesController.getDispute);

// Get dispute for specific order
router.get("/order/:orderId", disputesController.getOrderDispute);

// Comments (buyer, provider, admin can add/view)
router.post("/:id/comments", validate(addCommentSchema), disputesController.addComment);
router.get("/:id/comments", disputesController.getComments);

// Admin-only routes
router.get("/", requireRole("ADMIN"), disputesController.getAllDisputes);
router.post(
  "/:id/resolve",
  requireRole("ADMIN"),
  validate(resolveDisputeSchema),
  disputesController.resolveDispute,
);
router.patch(
  "/:id/status",
  requireRole("ADMIN"),
  validate(updateDisputeStatusSchema),
  disputesController.updateDisputeStatus,
);

export default router;
