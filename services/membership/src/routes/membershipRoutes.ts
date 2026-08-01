import { Router } from "express";
import { getMembers, applyRole } from "../controllers/membershipController";

const router = Router();

// GET /api/membership/members
router.get("/members", getMembers);

// POST /api/membership/apply-role
router.post("/apply-role", applyRole);

export default router;
