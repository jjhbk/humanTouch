import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors.js";
import type { ApiErrorResponse } from "@humanlayer/shared";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: "details" in err ? (err as { details: unknown }).details : undefined,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  console.error("Unhandled error:", err);

  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    },
  };
  res.status(500).json(response);
}
