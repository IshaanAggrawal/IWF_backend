import { Router } from "express";
import { submitContactForm, subscribeNewsletter } from "../controllers/contactController";
import { strictLimiter, globalLimiter } from "../../../../shared/middlewares/rateLimiter";

const router = Router();

// POST /api/contact
router.post("/", strictLimiter, submitContactForm);

// POST /api/contact/subscribe
router.post("/subscribe", globalLimiter, subscribeNewsletter);

export default router;
