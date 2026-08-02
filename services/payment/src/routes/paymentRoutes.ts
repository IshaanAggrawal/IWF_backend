import { Router } from "express";
import {
  download80GCertificate,
  downloadDonorCard,
  getDonors,
  getReceipt,
  initializeDonation,
  verifyDonation,
} from "../controllers/paymentController";
import { strictLimiter } from "@shared/middlewares/rateLimiter";

const router = Router();

// POST /api/donations/init
router.post("/init", strictLimiter, initializeDonation);

// POST /api/donations/verify
router.post("/verify", verifyDonation);

// GET /api/donations/donors
router.get("/donors", getDonors);

// GET /api/donations/receipt?receiptNo=...&email=...
router.get("/receipt", getReceipt);

// GET /api/donations/:transactionId/donor-card
router.get("/:transactionId/donor-card", downloadDonorCard);

// GET /api/donations/:transactionId/80g-certificate
router.get("/:transactionId/80g-certificate", download80GCertificate);

export default router;
