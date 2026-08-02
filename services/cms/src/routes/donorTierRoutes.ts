import { Router } from "express";
import { getDonorTiers, updateDonorTier } from "../controllers/donorTierController";
import { requireAdmin } from "@shared/middlewares/auth";

const router = Router();

// GET /api/cms/donor-tiers
router.get("/", requireAdmin, getDonorTiers);

// PUT /api/cms/donor-tiers/:id
router.put("/:id", requireAdmin, updateDonorTier);

export default router;
