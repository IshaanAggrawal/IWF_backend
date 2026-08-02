import { Router } from "express";
import membershipRoutes from "./membershipRoutes";

const router = Router();

router.use("/", membershipRoutes);

export default router;
