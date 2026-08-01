import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController";
import { requireAdmin } from "../../../../shared/middlewares/authMiddleware";

const router = Router();

// GET /api/cms/settings
router.get("/", getSettings);

// PUT /api/cms/settings (Protected)
router.put("/", requireAdmin, updateSettings);

export default router;
