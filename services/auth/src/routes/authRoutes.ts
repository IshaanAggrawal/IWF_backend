import { Router } from "express";
import { login, getMe } from "../controllers/authController";
import { requireAuth } from "@shared/middlewares/auth";
import { loginLimiter } from "@shared/middlewares/rateLimiter";

const router = Router();

// POST /api/auth/login
router.post("/login", loginLimiter, login);

// GET /api/auth/me (Protected)
router.get("/me", requireAuth, getMe);

export default router;
