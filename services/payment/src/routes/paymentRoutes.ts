import { Router } from "express";
import { initializeDonation, verifyDonation, getDonors } from "../controllers/paymentController";
import { strictLimiter } from "@shared/middlewares/rateLimiter";

const router = Router();

// POST /api/donations/init
router.post("/init", strictLimiter, initializeDonation);

// POST /api/donations/verify
router.post("/verify", verifyDonation);

// GET /api/donations/donors
router.get("/donors", getDonors);

export default router;
