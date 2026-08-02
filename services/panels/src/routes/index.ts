import { Router } from "express";
import { requireRole } from "@shared/middlewares/auth";
import { getAdminDashboard, getCoordinatorDashboard, getMemberDashboard } from "../controllers/panelController";

const router = Router();

router.get("/admin", requireRole("admin"), getAdminDashboard);
router.get("/coordinator", requireRole("admin", "coordinator"), getCoordinatorDashboard);
router.get("/member", requireRole("admin", "coordinator", "member", "user"), getMemberDashboard);

export default router;
