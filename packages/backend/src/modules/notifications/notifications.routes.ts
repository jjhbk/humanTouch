import { Router } from "express";
import * as notificationsController from "./notifications.controller.js";
import { authenticate } from "../../lib/middleware/auth.js";
import { validate } from "../../lib/middleware/validate.js";
import { markAsReadSchema } from "./notifications.schema.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/", notificationsController.getNotifications);
router.get("/unread-count", notificationsController.getUnreadCount);
router.post("/mark-read", validate(markAsReadSchema), notificationsController.markAsRead);

export default router;
