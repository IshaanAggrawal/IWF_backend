import { Router } from "express";
import {
  applyRole,
  createReferralCode,
  downloadFeeReceipt,
  downloadMembershipCard,
  getReferralReport,
  getMembers,
  getStatus,
  issueMember,
  renewMembership,
  requestOtp,
  verifyOtp,
} from "../controllers/membershipController";
import { requireRole } from "@shared/middlewares/auth";
import { strictLimiter } from "@shared/middlewares/rateLimiter";

const router = Router();

// GET /api/membership/members
router.get("/members", getMembers);

// POST /api/membership/apply-role
router.post("/apply-role", applyRole);

// POST /api/membership/otp/request
router.post("/otp/request", strictLimiter, requestOtp);

// POST /api/membership/otp/verify
router.post("/otp/verify", strictLimiter, verifyOtp);

// GET /api/membership/status?identifier=
router.get("/status", getStatus);

// POST /api/membership/renew
router.post("/renew", strictLimiter, renewMembership);

// POST /api/membership/applications/:applicationId/issue
router.post("/applications/:applicationId/issue", requireRole("admin", "coordinator"), issueMember);

// GET /api/membership/card/:memberId
router.get("/card/:memberId", downloadMembershipCard);

// GET /api/membership/fee-receipt/:memberId
router.get("/fee-receipt/:memberId", downloadFeeReceipt);

// POST /api/membership/:memberId/referrals
router.post("/:memberId/referrals", requireRole("admin", "coordinator", "member", "user"), createReferralCode);

// GET /api/membership/:memberId/referrals
router.get("/:memberId/referrals", requireRole("admin", "coordinator", "member", "user"), getReferralReport);

export default router;
