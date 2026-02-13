import type { Request, Response } from "express";
import { smartAccountsService } from "./smart-accounts.service.js";

export class SmartAccountsController {
  /**
   * POST /api/v1/smart-accounts
   * Create or get smart account for current user
   */
  async createSmartAccount(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const apiKeyId = req.apiKey?.id;

      if (!apiKeyId) {
        return res.status(400).json({
          error: "API key required. Use X-API-Key header for authentication.",
        });
      }

      const result = await smartAccountsService.createOrGetSmartAccount(userId, apiKeyId);

      return res.status(200).json({
        message: ("needsFunding" in result && result.needsFunding)
          ? "Smart account created. Please fund it with USDC before making transactions."
          : "Smart account ready",
        data: result,
      });
    } catch (error) {
      console.error("Error creating smart account:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to create smart account",
      });
    }
  }

  /**
   * GET /api/v1/smart-accounts/balance
   * Get smart account balance
   */
  async getBalance(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const balance = await smartAccountsService.getBalance(userId);

      return res.status(200).json({
        data: balance,
      });
    } catch (error) {
      console.error("Error getting balance:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get balance",
      });
    }
  }

  /**
   * GET /api/v1/smart-accounts/me
   * Get current user's smart account details
   */
  async getMySmartAccount(req: Request, res: Response) {
    try {
      const userId = req.user!.id;

      const smartAccount = await smartAccountsService.getUserSmartAccount(userId);

      if (!smartAccount) {
        return res.status(404).json({
          error: "Smart account not found. Create one first.",
        });
      }

      return res.status(200).json({
        data: smartAccount,
      });
    } catch (error) {
      console.error("Error getting smart account:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to get smart account",
      });
    }
  }

  /**
   * POST /api/v1/orders/:orderId/deposit-escrow
   * Deposit escrow via smart account
   */
  async depositEscrow(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const apiKeyId = req.apiKey?.id;
      const { orderId } = req.params;
      const { amount } = req.body;

      if (!apiKeyId) {
        return res.status(400).json({
          error: "API key required for smart account transactions.",
        });
      }

      // Check daily limit
      await smartAccountsService.checkDailyLimit(userId, amount);

      const result = await smartAccountsService.depositEscrow(
        userId,
        apiKeyId,
        orderId,
        amount
      );

      return res.status(200).json({
        message: "Escrow deposit successful",
        data: result,
      });
    } catch (error) {
      console.error("Error depositing escrow:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to deposit escrow",
      });
    }
  }

  /**
   * POST /api/v1/orders/:orderId/release-payment
   * Release escrow payment via smart account
   */
  async releasePayment(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const apiKeyId = req.apiKey?.id;
      const { orderId } = req.params;

      if (!apiKeyId) {
        return res.status(400).json({
          error: "API key required for smart account transactions.",
        });
      }

      const result = await smartAccountsService.releasePayment(userId, apiKeyId, orderId);

      return res.status(200).json({
        message: "Payment released successfully",
        data: result,
      });
    } catch (error) {
      console.error("Error releasing payment:", error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to release payment",
      });
    }
  }
}

export const smartAccountsController = new SmartAccountsController();
