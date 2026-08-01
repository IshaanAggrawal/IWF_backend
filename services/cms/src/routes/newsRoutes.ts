import { Router } from "express";
import { getNews, createNews } from "../controllers/newsController";
import { requireAdmin } from "../../../../shared/middlewares/authMiddleware";

const router = Router();

// GET /api/cms/news
router.get("/", getNews);

// POST /api/cms/news (Protected)
router.post("/", requireAdmin, createNews);

export default router;
