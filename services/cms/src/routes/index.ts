import { Router } from "express";
import newsRoutes from "./newsRoutes";
import patientRoutes from "./patientRoutes";
import settingsRoutes from "./settingsRoutes";
import noticeRoutes from "./noticeRoutes";
import donorTierRoutes from "./donorTierRoutes";
import genericCmsRoutes from "./genericCmsRoutes";

const router = Router();

router.use("/news", newsRoutes);
router.use("/patients", patientRoutes);
router.use("/settings", settingsRoutes);
router.use("/notices", noticeRoutes);
router.use("/donor-tiers", donorTierRoutes);

router.use("/:resource", genericCmsRoutes);

export default router;
