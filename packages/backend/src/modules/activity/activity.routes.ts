import { Router } from "express";
import * as activityController from "./activity.controller.js";
import { authenticate } from "../../lib/middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/summary", activityController.getActivitySummary);
router.get("/new", activityController.getNewActivity);

export default router;
