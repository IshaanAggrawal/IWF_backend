import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ status: "error", message: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  return res.status(500).json({ status: "error", message });
}
