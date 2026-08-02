import { Router } from "express";
import newsRoutes from "./newsRoutes";
import patientRoutes from "./patientRoutes";
import settingsRoutes from "./settingsRoutes";
import noticeRoutes from "./noticeRoutes";
import donorTierRoutes from "./donorTierRoutes";

const router = Router();

router.use("/news", newsRoutes);
router.use("/patients", patientRoutes);
router.use("/settings", settingsRoutes);
router.use("/notices", noticeRoutes);
router.use("/donor-tiers", donorTierRoutes);

export default router;
