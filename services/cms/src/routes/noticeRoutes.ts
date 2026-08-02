import { Router } from "express";
import { getNotices, createNotice } from "../controllers/noticeController";
import { requireAdmin } from "@shared/middlewares/auth";

const router = Router();

// GET /api/cms/notices
router.get("/", getNotices);

// POST /api/cms/notices (Protected)
router.post("/", requireAdmin, createNotice);

export default router;
