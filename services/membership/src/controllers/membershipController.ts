import { Request, Response } from "express";
import { Member } from "@shared/models/Member";
import { ReferralCode } from "@shared/models/Referral";
import {
  getMembershipCardPayload,
  getMembershipFeeReceiptPayload,
  getVerifiedMembershipStatus,
  issueMemberFromApplication,
  processMembershipApplication,
  renewVerifiedMembership,
  requestMembershipOtp,
  verifyMembershipOtp,
} from "../services/membershipService";
import { z } from "zod";
import { AppError } from "@shared/utils/AppError";

const sendMembershipError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ status: "error", error: error.message });
  }
  if (error instanceof z.ZodError) {
    return res.status(400).json({ error: "Invalid data", details: error.issues });
  }
  return res.status(500).json({ error: fallbackMessage });
};

const firstParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value || "");

export const getMembers = async (req: Request, res: Response) => {
  try {
    // Only fetch approved members for public listing
    const members = await Member.find({ status: "Active" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ error: "Server error fetching members" });
  }
};



const applicationSchema = z.object({
  fullName: z.string().min(2),
  fatherName: z.string().optional(),
  mobile: z.string().min(10),
  email: z.string().email(),
  address: z.string(),
  state: z.string(),
  district: z.string(),
  pincode: z.string(),
  category: z.enum(["Blue", "Yellow", "Green"]),
  membershipPeriod: z.number().int().positive(),
  paymentMode: z.string(),
  amount: z.number().positive(),
  convenienceFee: z.number().optional(),
  consentDisplay: z.boolean().optional(),
  paymentDetails: z.record(z.string(), z.any()).optional(),
  photoUrl: z.string().optional(),
  idProofUrl: z.string().optional(),
});

export const applyRole = async (req: Request, res: Response) => {
  try {
    const validatedData = applicationSchema.parse(req.body);
    
    const application = await processMembershipApplication(validatedData);
    
    res.status(201).json({ 
      success: true, 
      message: "Role application submitted successfully",
      data: application 
    });
  } catch (error) {
    console.error("Error applying for role:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid application data", details: (error as any).issues || (error as any).errors });
    }
    res.status(500).json({ error: "Server error submitting application" });
  }
};

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const result = await requestMembershipOtp(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error requesting membership OTP:", error);
    return sendMembershipError(res, error, "Server error requesting OTP");
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const result = await verifyMembershipOtp(req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error verifying membership OTP:", error);
    return sendMembershipError(res, error, "Server error verifying OTP");
  }
};

export const getStatus = async (req: Request, res: Response) => {
  try {
    const member = await getVerifiedMembershipStatus(req.query.identifier);
    res.status(200).json({ success: true, data: member });
  } catch (error) {
    console.error("Error fetching membership status:", error);
    return sendMembershipError(res, error, "Server error fetching membership status");
  }
};

export const renewMembership = async (req: Request, res: Response) => {
  try {
    const member = await renewVerifiedMembership(req.body);
    res.status(200).json({ success: true, message: "Membership renewed successfully", data: member });
  } catch (error) {
    console.error("Error renewing membership:", error);
    return sendMembershipError(res, error, "Server error renewing membership");
  }
};

export const issueMember = async (req: Request, res: Response) => {
  try {
    const member = await issueMemberFromApplication(firstParam(req.params.applicationId));
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    console.error("Error issuing member:", error);
    return sendMembershipError(res, error, "Server error issuing member");
  }
};

export const downloadMembershipCard = async (req: Request, res: Response) => {
  try {
    const member = await getMembershipCardPayload(firstParam(req.params.memberId));
    res.status(200).json({
      success: true,
      message: "Membership card data fetched successfully",
      data: {
        organization: "Islah Welfare Foundation",
        documentType: "membership_card",
        memberId: member.memberId,
        fullName: member.fullName,
        category: member.category,
        categorySnapshot: member.categorySnapshot,
        status: member.status,
        joined: member.joined,
        validTill: member.validTill,
        photoUrl: member.photoUrl,
      },
    });
  } catch (error) {
    console.error("Error generating membership card:", error);
    return sendMembershipError(res, error, "Server error generating membership card");
  }
};

export const downloadFeeReceipt = async (req: Request, res: Response) => {
  try {
    const { member, receiptNo, amount } = await getMembershipFeeReceiptPayload(firstParam(req.params.memberId));
    res.status(200).json({
      success: true,
      message: "Membership fee receipt data fetched successfully",
      data: {
        organization: "Islah Welfare Foundation",
        documentType: "membership_fee_receipt",
        receiptNo,
        memberId: member.memberId,
        fullName: member.fullName,
        category: member.category,
        amount,
        paymentMode: member.paymentMode,
        paymentDate: member.paymentDate || member.joined,
      },
    });
  } catch (error) {
    console.error("Error generating fee receipt:", error);
    return sendMembershipError(res, error, "Server error generating fee receipt");
  }
};

export const createReferralCode = async (req: Request, res: Response) => {
  try {
    const memberId = firstParam(req.params.memberId).toUpperCase();
    const member = await Member.findOne({ memberId });
    if (!member) return res.status(404).json({ error: "Member not found" });

    const code = (req.body.code || `${member.memberId.replace(/[^A-Z0-9]/gi, "")}${Date.now().toString().slice(-4)}`)
      .toString()
      .toUpperCase();
    const referral = await ReferralCode.findOneAndUpdate(
      { code },
      { code, memberId: member.memberId, active: true },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ success: true, data: referral, link: `/donate?ref=${referral.code}` });
  } catch (error) {
    console.error("Error creating referral code:", error);
    return sendMembershipError(res, error, "Server error creating referral code");
  }
};

export const getReferralReport = async (req: Request, res: Response) => {
  try {
    const data = await ReferralCode.find({ memberId: firstParam(req.params.memberId).toUpperCase() }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching referral report:", error);
    res.status(500).json({ error: "Server error fetching referral report" });
  }
};
