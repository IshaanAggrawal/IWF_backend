import { Router } from "express";
import paymentRoutes from "./paymentRoutes";

const router = Router();

router.use("/", paymentRoutes);

export default router;
