import { Router } from "express";
import * as quotesController from "./quotes.controller.js";
import { authenticate } from "../../lib/middleware/auth.js";
import { validate } from "../../lib/middleware/validate.js";
import { requestQuoteSchema, respondQuoteSchema } from "./quotes.schema.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(requestQuoteSchema), quotesController.requestQuote);
router.get("/", quotesController.listMyQuotes);
router.get("/:id", quotesController.getOne);
router.post("/:id/respond", validate(respondQuoteSchema), quotesController.respond);
router.post("/:id/accept", quotesController.accept);
router.post("/:id/reject", quotesController.reject);
router.post("/:id/withdraw", quotesController.withdraw);

export default router;
