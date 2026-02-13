import { Router } from "express";
import { smartAccountsController } from "./smart-accounts.controller.js";
import { authenticate } from "../../lib/middleware/auth.js";
import { validate } from "../../lib/middleware/validate.js";
import {
  createSmartAccountSchema,
  getBalanceSchema,
} from "./smart-accounts.schema.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/smart-accounts
 * @desc    Create or get smart account for current user
 * @access  Private (API Key or JWT)
 */
router.post(
  "/",
  validate(createSmartAccountSchema),
  smartAccountsController.createSmartAccount.bind(smartAccountsController)
);

/**
 * @route   GET /api/v1/smart-accounts/balance
 * @desc    Get smart account balance
 * @access  Private (API Key or JWT)
 */
router.get(
  "/balance",
  validate(getBalanceSchema),
  smartAccountsController.getBalance.bind(smartAccountsController)
);

/**
 * @route   GET /api/v1/smart-accounts/me
 * @desc    Get current user's smart account details
 * @access  Private (API Key or JWT)
 */
router.get("/me", smartAccountsController.getMySmartAccount.bind(smartAccountsController));

export default router;
