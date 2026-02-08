import type { Request, Response, NextFunction } from "express";
import * as ordersService from "./orders.service.js";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { quoteId } = req.body;
    const order = await ordersService.create(req.user!.id, quoteId);
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function confirm(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.confirm(req.user!.id, req.params.id, req.body.reason);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function start(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.start(req.user!.id, req.params.id, req.body.reason);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function deliver(req: Request, res: Response, next: NextFunction) {
  try {
    const { deliverables, reason } = req.body;
    const order = await ordersService.deliver(req.user!.id, req.params.id, deliverables, reason);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.complete(req.user!.id, req.params.id, req.body.reason);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function dispute(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.dispute(req.user!.id, req.params.id, req.body.reason);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.cancel(req.user!.id, req.params.id, req.body.reason);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await ordersService.getById(req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function listMyOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const role = (req.query.role as string) === "provider" ? "provider" : "buyer";
    const orders = await ordersService.listForUser(req.user!.id, role as "buyer" | "provider");
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}
