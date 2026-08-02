import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";

export type AuthUser = { id: string; email: string; role: string };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      admin?: any;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required", 401));
  }

  const token = header.slice(7);
  try {
    const secret = process.env.JWT_SECRET || "super_secret_jwt_key_change_in_prod";
    const payload = jwt.verify(token, secret) as AuthUser;
    req.user = payload;
    next();
  } catch {
    next(new AppError("Invalid or expired token", 401));
  }
}

export function signToken(user: AuthUser): string {
  const secret = process.env.JWT_SECRET || "super_secret_jwt_key_change_in_prod";
  return jwt.sign(user, secret, { expiresIn: "7d" });
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, (error?: unknown) => {
      if (error) return next(error);
      if (!req.user || !roles.includes(req.user.role)) {
        return next(new AppError("Insufficient permissions", 403));
      }
      next();
    });
  };
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError("Access denied. No token provided.", 401));
  }

  const token = header.slice(7);
  try {
    const secret = process.env.JWT_SECRET || "super_secret_jwt_key_change_in_prod";
    const payload = jwt.verify(token, secret);
    const typedPayload = payload as AuthUser;
    if (typedPayload.role !== "admin") {
      return next(new AppError("Admin access required.", 403));
    }
    req.admin = typedPayload;
    next();
  } catch (error) {
    console.error("JWT Verification failed:", error);
    next(new AppError("Invalid or expired token.", 401));
  }
}
