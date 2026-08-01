import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request type to include admin payload
declare global {
  namespace Express {
    interface Request {
      admin?: any;
    }
  }
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "super_secret_jwt_key_change_in_prod";
    
    const decoded = jwt.verify(token, secret);
    req.admin = decoded; // Attach payload to request object
    
    next();
  } catch (error) {
    console.error("JWT Verification failed:", error);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
