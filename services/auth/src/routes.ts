import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AdminUser } from "../../../shared/models/AdminUser";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { AppError } from "../../../shared/utils/AppError";
import { requireAuth, signToken } from "../../../shared/middlewares/auth";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await AdminUser.findOne({ email: email.toLowerCase() });
    if (!user) throw new AppError("Invalid credentials", 401);

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppError("Invalid credentials", 401);

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({
      status: "success",
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await AdminUser.findById(req.user!.id).select("-passwordHash");
    if (!user) throw new AppError("User not found", 404);
    res.json({ status: "success", user });
  })
);

export default router;
