import { Router } from "express";
import * as ordersController from "./orders.controller.js";
import { authenticate } from "../../lib/middleware/auth.js";
import { validate } from "../../lib/middleware/validate.js";
import { createOrderSchema, transitionOrderSchema, deliverOrderSchema } from "./orders.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createOrderSchema), ordersController.create);
router.get("/", ordersController.listMyOrders);
router.get("/:id", ordersController.getOne);
router.post("/:id/confirm", validate(transitionOrderSchema), ordersController.confirm);
router.post("/:id/start", validate(transitionOrderSchema), ordersController.start);
router.post("/:id/deliver", validate(deliverOrderSchema), ordersController.deliver);
router.post("/:id/complete", validate(transitionOrderSchema), ordersController.complete);
router.post("/:id/dispute", validate(transitionOrderSchema), ordersController.dispute);
router.post("/:id/cancel", validate(transitionOrderSchema), ordersController.cancel);

export default router;
