import type { Request, Response, NextFunction } from "express";
import * as disputesService from "./disputes.service.js";

export async function createDispute(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId, reason, description } = req.body;
    const raisedBy = req.user!.id;

    console.log("Create dispute request:", { orderId, reason, description, raisedBy });

    // Basic validation
    if (!orderId || !reason || !description) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Missing required fields",
          details: {
            orderId: !orderId ? "Order ID is required" : undefined,
            reason: !reason ? "Reason is required" : undefined,
            description: !description ? "Description is required" : undefined,
          }
        }
      });
    }

    if (description.length < 10) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Description must be at least 10 characters"
        }
      });
    }

    const dispute = await disputesService.createDispute(orderId, raisedBy, reason, description);

    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
}

export async function getDispute(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const dispute = await disputesService.getDispute(id, userId, userRole);

    res.json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
}

export async function getOrderDispute(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const dispute = await disputesService.getOrderDispute(orderId, userId, userRole);

    res.json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
}

export async function getAllDisputes(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;

    const disputes = await disputesService.getAllDisputes(status);

    res.json({ success: true, data: disputes });
  } catch (error) {
    next(error);
  }
}

export async function resolveDispute(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { resolution, newOrderStatus, releaseTxHash } = req.body;
    const resolvedBy = req.user!.id;

    const dispute = await disputesService.resolveDispute(id, resolvedBy, resolution, newOrderStatus, releaseTxHash);

    res.json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
}

export async function updateDisputeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const dispute = await disputesService.updateDisputeStatus(id, status);

    res.json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
}

export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const disputeComment = await disputesService.addComment(id, userId, userRole, comment);

    res.status(201).json({ success: true, data: disputeComment });
  } catch (error) {
    next(error);
  }
}

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const comments = await disputesService.getComments(id, userId, userRole);

    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
}
