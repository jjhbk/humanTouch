import { Router } from "express";
import * as messagesController from "./messages.controller.js";
import { authenticate } from "../../lib/middleware/auth.js";
import { validate } from "../../lib/middleware/validate.js";
import { sendMessageSchema, markAsReadSchema } from "./messages.schema.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post("/", validate(sendMessageSchema), messagesController.sendMessage);
router.get("/unread-count", messagesController.getUnreadCount);
router.post("/mark-read", validate(markAsReadSchema), messagesController.markAsRead);
router.get("/order/:orderId", messagesController.getOrderMessages);

export default router;
