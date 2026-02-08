import { Router } from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "../../lib/middleware/auth.js";
import { validate } from "../../lib/middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  generateNonceSchema,
  verifyWalletSchema,
  createApiKeySchema,
  becomeProviderSchema,
} from "./auth.schema.js";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/wallet/nonce", validate(generateNonceSchema), authController.generateNonce);
router.post("/wallet/verify", validate(verifyWalletSchema), authController.verifyWallet);

router.get("/me", authenticate, authController.getMe);
router.post("/become-provider", authenticate, validate(becomeProviderSchema), authController.becomeProvider);
router.post("/api-keys", authenticate, validate(createApiKeySchema), authController.createApiKey);
router.get("/api-keys", authenticate, authController.listApiKeys);
router.delete("/api-keys/:keyId", authenticate, authController.revokeApiKey);

export default router;
