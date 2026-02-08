import { Router } from "express";
import * as reviewsController from "./reviews.controller.js";
import { authenticate } from "../../lib/middleware/auth.js";
import { validate } from "../../lib/middleware/validate.js";
import { submitReviewSchema, replyReviewSchema, listReviewsSchema } from "./reviews.schema.js";

const router = Router();

router.get("/", validate(listReviewsSchema, "query"), reviewsController.list);
router.post("/", authenticate, validate(submitReviewSchema), reviewsController.submit);
router.post("/:id/reply", authenticate, validate(replyReviewSchema), reviewsController.reply);

export default router;
