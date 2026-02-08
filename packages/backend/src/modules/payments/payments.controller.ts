import type { Request, Response, NextFunction } from "express";
import * as paymentsService from "./payments.service.js";

export async function getEscrowInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const info = await paymentsService.getEscrowInfo(req.params.orderId);
    res.json({ success: true, data: info });
  } catch (err) {
    next(err);
  }
}

export async function confirmDeposit(req: Request, res: Response, next: NextFunction) {
  try {
    const { txHash } = req.body;
    const order = await paymentsService.confirmDeposit(req.params.orderId, txHash);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function release(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await paymentsService.release(req.params.orderId, req.user!.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
