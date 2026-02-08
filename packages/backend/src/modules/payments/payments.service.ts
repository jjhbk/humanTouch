import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ValidationError } from "../../lib/errors.js";
import { isValidOrderTransition } from "@humanlayer/shared";
import type { OrderStatus } from "@humanlayer/shared";

export async function getEscrowInfo(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { listing: true },
  });
  if (!order) throw new NotFoundError("Order");

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: order.amount.toString(),
    currency: order.listing.currency,
    escrowContractAddress: process.env.ESCROW_CONTRACT_ADDRESS || "",
    chainId: Number(process.env.BASE_CHAIN_ID) || 84532,
    usdcAddress: process.env.USDC_ADDRESS || "",
  };
}

export async function confirmDeposit(orderId: string, txHash: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");

  if (!isValidOrderTransition(order.status as OrderStatus, "CONFIRMED")) {
    throw new ValidationError(`Cannot confirm deposit for order in ${order.status} status`);
  }

  const [updated] = await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CONFIRMED",
        escrowTxHash: txHash,
      },
    }),
    prisma.transaction.create({
      data: {
        txHash,
        type: "ESCROW_DEPOSIT",
        fromAddress: "",
        toAddress: process.env.ESCROW_CONTRACT_ADDRESS || "",
        amount: order.amount,
        chainId: Number(process.env.BASE_CHAIN_ID) || 84532,
        orderId: order.id,
        status: "CONFIRMED",
      },
    }),
    prisma.orderStatusLog.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "CONFIRMED",
        changedBy: "system",
        reason: `Escrow deposit confirmed: ${txHash}`,
      },
    }),
  ]);

  return updated;
}

export async function release(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new NotFoundError("Order");
  if (order.status !== "COMPLETED") {
    throw new ValidationError("Order must be completed before releasing escrow");
  }

  return {
    orderId: order.id,
    amount: order.amount.toString(),
    escrowContractAddress: process.env.ESCROW_CONTRACT_ADDRESS || "",
    chainId: Number(process.env.BASE_CHAIN_ID) || 84532,
    message: "Escrow release initiated",
  };
}
