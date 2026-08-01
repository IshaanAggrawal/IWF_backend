import { Router } from "express";
import paymentRoutes from "./routes/paymentRoutes";

const router = Router();

router.use("/", paymentRoutes);

export default router;
