import { Router } from "express";
import membershipRoutes from "./routes/membershipRoutes";

const router = Router();

router.use("/", membershipRoutes);

export default router;
