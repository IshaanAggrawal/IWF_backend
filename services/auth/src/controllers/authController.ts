import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AdminUser } from "../../../../shared/models/AdminUser";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import { AppError } from "../../../../shared/utils/AppError";
import { signToken } from "../../../../shared/middlewares/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
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
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await AdminUser.findById(req.user!.id).select("-passwordHash");
  if (!user) throw new AppError("User not found", 404);
  res.json({ status: "success", user });
});
