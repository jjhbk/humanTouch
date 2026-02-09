import { Router } from "express";
import * as paymentsController from "./payments.controller.js";
import { authenticate } from "../../lib/middleware/auth.js";
import { validate } from "../../lib/middleware/validate.js";
import { confirmDepositSchema } from "./payments.schema.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/:orderId/escrow", paymentsController.getEscrowInfo);
router.post("/:orderId/deposit", validate(confirmDepositSchema), paymentsController.confirmDeposit);
router.post("/:orderId/release", paymentsController.release);

export default router;
