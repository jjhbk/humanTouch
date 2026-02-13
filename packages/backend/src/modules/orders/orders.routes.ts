import { Router } from "express";
import * as ordersController from "./orders.controller.js";
import { smartAccountsController } from "../smart-accounts/smart-accounts.controller.js";
import { authenticate } from "../../lib/middleware/auth.js";
import { validate } from "../../lib/middleware/validate.js";
import { createOrderSchema, transitionOrderSchema, deliverOrderSchema } from "./orders.schema.js";
import { depositEscrowSchema, releasePaymentSchema } from "../smart-accounts/smart-accounts.schema.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post("/", validate(createOrderSchema), ordersController.create);
router.get("/", ordersController.listMyOrders);
router.get("/:id", ordersController.getOne);
router.get("/:id/status-logs", ordersController.getStatusLogs);
router.post("/:id/confirm", validate(transitionOrderSchema), ordersController.confirm);
router.post("/:id/start", validate(transitionOrderSchema), ordersController.start);
router.post("/:id/deliver", validate(deliverOrderSchema), ordersController.deliver);
router.post("/:id/complete", validate(transitionOrderSchema), ordersController.complete);
router.post("/:id/release-escrow", ordersController.releaseEscrow);
router.post("/:id/dispute", validate(transitionOrderSchema), ordersController.dispute);
router.post("/:id/cancel", validate(transitionOrderSchema), ordersController.cancel);

// Account Abstraction endpoints (for AI agents)
router.post("/:orderId/deposit-escrow", validate(depositEscrowSchema), smartAccountsController.depositEscrow.bind(smartAccountsController));
router.post("/:orderId/release-payment", validate(releasePaymentSchema), smartAccountsController.releasePayment.bind(smartAccountsController));

export default router;
