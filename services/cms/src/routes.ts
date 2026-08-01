import { Router } from "express";
import newsRoutes from "./routes/newsRoutes";
import patientRoutes from "./routes/patientRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import noticeRoutes from "./routes/noticeRoutes";

const router = Router();

router.use("/news", newsRoutes);
router.use("/patients", patientRoutes);
router.use("/settings", settingsRoutes);
router.use("/notices", noticeRoutes);

export default router;
