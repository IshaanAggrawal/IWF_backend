import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { z } from "zod";
import mongoose from "mongoose";
import { Donor } from "../../../shared/models/Donor";
import { DonationTransaction } from "../../../shared/models/DonationTransaction";
import { PatientCampaign } from "../../../shared/models/PatientCampaign";
import { DonorTierConfig, cardTierFromAmount } from "../../../shared/models/DonorTierConfig";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { AppError } from "../../../shared/utils/AppError";
import { generateReceiptNo } from "../../../shared/utils/receiptNo";
import { requireAuth } from "../../../shared/middlewares/auth";

const router = Router();

function getRazorpay(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId.includes("YOUR_")) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function isTestMode(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  return keyId.startsWith("rzp_test_") || keyId.includes("YOUR_");
}

async function resolveCardTier(amount: number) {
  const config = await DonorTierConfig.findOne({ key: "default" });
  return cardTierFromAmount(amount, config?.tiers);
}

const paymentDetailsSchema = z
  .object({
    channel: z.enum(["upi", "card", "netbanking", "wallet", "unknown"]).optional(),
    upiId: z.string().optional(),
    bankReference: z.string().optional(),
    chequeNumber: z.string().optional(),
    chequeDate: z.string().optional(),
    chequeBank: z.string().optional(),
    notes: z.string().optional(),
  })
  .optional();

const donationSchema = z
  .object({
    donorType: z.enum(["individual", "corporate", "institution"]),
    citizenship: z.enum(["indian", "foreign"]),
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(10),
    address: z.string().min(5),
    pan: z.string().optional(),
    taxExemption: z.boolean().optional().default(false),
    consentDisplay: z.boolean().optional().default(false),
    /** alias from frontend form field `consent` */
    consent: z.boolean().optional(),
    financialType: z.string().min(1),
    amount: z.number().min(1),
    paymentMode: z.enum(["online", "bank", "offline"]),
    patientId: z.string().optional(),
    patientSlug: z.string().optional(),
    paymentDetails: paymentDetailsSchema,
  })
  .superRefine((data, ctx) => {
    if (data.citizenship === "indian" && data.taxExemption) {
      if (!data.pan || !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(data.pan)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Valid PAN required for 80G tax exemption",
          path: ["pan"],
        });
      }
    }
  });

async function resolvePatientId(patientId?: string, patientSlug?: string) {
  if (patientId && mongoose.isValidObjectId(patientId)) return patientId;
  if (patientSlug) {
    const p = await PatientCampaign.findOne({ slug: patientSlug });
    return p?._id?.toString();
  }
  return undefined;
}

async function upsertDonor(data: z.infer<typeof donationSchema>) {
  const consentDisplay = data.consentDisplay ?? data.consent ?? false;
  let donor = await Donor.findOne({ email: data.email.toLowerCase() });
  if (!donor) {
    donor = await Donor.create({
      donorType: data.donorType,
      citizenship: data.citizenship,
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      address: data.address,
      pan: data.pan,
      tier: "None",
      totalDonated: 0,
      consentDisplay,
    });
  } else {
    donor.fullName = data.fullName;
    donor.phone = data.phone;
    donor.address = data.address;
    donor.donorType = data.donorType;
    donor.citizenship = data.citizenship;
    if (data.pan) donor.pan = data.pan;
    donor.consentDisplay = consentDisplay;
    await donor.save();
  }
  return donor;
}

async function markDonationSuccess(
  txn: InstanceType<typeof DonationTransaction>,
  paymentId?: string,
  paymentDetails?: z.infer<typeof paymentDetailsSchema>
) {
  if (txn.status === "success") return txn;
  txn.status = "success";
  if (paymentId) txn.razorpayPaymentId = paymentId;
  if (paymentDetails) {
    txn.paymentDetails = { ...(txn.paymentDetails || {}), ...paymentDetails };
  }
  if (!txn.receiptNo) txn.receiptNo = generateReceiptNo("DON");
  await txn.save();

  const donor = await Donor.findById(txn.donorId);
  if (donor) {
    donor.totalDonated += txn.amount;
    donor.tier = await resolveCardTier(donor.totalDonated);
    donor.lastDonationAt = new Date();
    if (txn.consentDisplay) donor.consentDisplay = true;
    await donor.save();
  }

  if (txn.patientId) {
    const patient = await PatientCampaign.findById(txn.patientId);
    if (patient) {
      patient.raisedAmount += txn.amount;
      patient.donorsCount += 1;
      const displayName = txn.consentDisplay && donor?.fullName ? donor.fullName : "A donor";
      patient.donationHistory.unshift({
        donor: displayName,
        amount: txn.amount,
        date: new Date().toISOString().slice(0, 10),
      });
      await patient.save();
    }
  }
  return txn;
}

/** Public: donor card thresholds (Silver / Gold / Platinum) */
router.get(
  "/tiers",
  asyncHandler(async (_req, res) => {
    let config = await DonorTierConfig.findOne({ key: "default" });
    if (!config) {
      config = await DonorTierConfig.create({
        key: "default",
        tiers: [
          { name: "Silver", minAmount: 1, color: "#6B7280", label: "Silver Donor" },
          { name: "Gold", minAmount: 10000, color: "#D97706", label: "Gold Donor" },
          { name: "Platinum", minAmount: 50000, color: "#8B5CF6", label: "Platinum Donor" },
        ],
      });
    }
    res.json({
      status: "success",
      note: "Donor recognition cards (Silver/Gold/Platinum). Membership cards are Blue/Yellow/Green under /api/cms/membership-categories.",
      config,
    });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = donationSchema.parse(req.body);
    const consentDisplay = data.consentDisplay ?? data.consent ?? false;
    const donor = await upsertDonor(data);
    const patientId = await resolvePatientId(data.patientId, data.patientSlug);
    const donorCardTier = await resolveCardTier(data.amount);

    const formSnapshot = {
      donorType: data.donorType,
      citizenship: data.citizenship,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      pan: data.pan,
      taxExemption: data.taxExemption ?? false,
      consentDisplay,
      financialType: data.financialType,
      amount: data.amount,
      paymentMode: data.paymentMode,
      patientSlug: data.patientSlug,
    };

    const txn = await DonationTransaction.create({
      donorId: donor._id,
      patientId,
      amount: data.amount,
      financialType: data.financialType,
      paymentMode: data.paymentMode,
      taxExemption: data.taxExemption ?? false,
      consentDisplay,
      donorCardTier,
      formSnapshot,
      paymentDetails: data.paymentDetails,
      status: "pending",
    });

    res.status(201).json({
      status: "success",
      donation: txn,
      donor: {
        id: donor.id,
        fullName: donor.fullName,
        email: donor.email,
        lifetimeTier: donor.tier,
        totalDonated: donor.totalDonated,
      },
      donorCardForThisGift: donorCardTier,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID?.includes("YOUR_")
        ? null
        : process.env.RAZORPAY_KEY_ID || null,
      testMode: isTestMode(),
      next:
        data.paymentMode === "online"
          ? "POST /api/donations/create-order then /verify"
          : "Bank/offline stays pending until admin PATCH /api/donations/:id/confirm",
    });
  })
);

router.post(
  "/create-order",
  asyncHandler(async (req, res) => {
    const schema = z.object({ donationId: z.string().min(1) });
    const { donationId } = schema.parse(req.body);
    const txn = await DonationTransaction.findById(donationId);
    if (!txn) throw new AppError("Donation not found", 404);
    if (txn.paymentMode !== "online") throw new AppError("Order only for online payments", 400);

    const razorpay = getRazorpay();
    if (!razorpay) {
      const mockOrderId = `order_test_${txn.id}`;
      txn.razorpayOrderId = mockOrderId;
      await txn.save();
      return res.json({
        status: "success",
        order: { id: mockOrderId, amount: txn.amount * 100, currency: "INR", mock: true },
        keyId: null,
        message: "Razorpay test keys not configured — using mock order. Set RAZORPAY_KEY_ID/SECRET in .env",
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(txn.amount * 100),
      currency: "INR",
      receipt: `don_${txn.id}`,
      notes: { donationId: txn.id, donorCardTier: txn.donorCardTier },
    });

    txn.razorpayOrderId = order.id;
    await txn.save();

    res.json({
      status: "success",
      order,
      keyId: process.env.RAZORPAY_KEY_ID,
      testMode: isTestMode(),
      donorCardTier: txn.donorCardTier,
    });
  })
);

router.post(
  "/verify",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      donationId: z.string(),
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string().optional(),
      paymentDetails: paymentDetailsSchema,
    });
    const body = schema.parse(req.body);
    const txn = await DonationTransaction.findById(body.donationId);
    if (!txn) throw new AppError("Donation not found", 404);

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isMock = body.razorpay_order_id.startsWith("order_test_");

    if (!isMock && keySecret && !keySecret.includes("YOUR_")) {
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
        .digest("hex");
      if (body.razorpay_signature && expected !== body.razorpay_signature) {
        txn.status = "failed";
        await txn.save();
        throw new AppError("Payment signature verification failed", 400);
      }
      txn.razorpaySignature = body.razorpay_signature;
    }

    await markDonationSuccess(txn, body.razorpay_payment_id, body.paymentDetails);
    const donor = await Donor.findById(txn.donorId);

    res.json({
      status: "success",
      donation: txn,
      donor,
      receipt: {
        receiptNo: txn.receiptNo,
        donorCardTier: txn.donorCardTier,
        amount: txn.amount,
        financialType: txn.financialType,
      },
    });
  })
);

router.patch(
  "/:id/confirm",
  requireAuth,
  asyncHandler(async (req, res) => {
    const schema = z.object({ paymentDetails: paymentDetailsSchema }).partial();
    const body = schema.parse(req.body || {});
    const txn = await DonationTransaction.findById(req.params.id);
    if (!txn) throw new AppError("Donation not found", 404);
    await markDonationSuccess(txn, undefined, body.paymentDetails);
    res.json({ status: "success", donation: txn });
  })
);

router.patch(
  "/:id/payment-details",
  asyncHandler(async (req, res) => {
    const body = paymentDetailsSchema.parse(req.body);
    const txn = await DonationTransaction.findById(req.params.id);
    if (!txn) throw new AppError("Donation not found", 404);
    txn.paymentDetails = { ...(txn.paymentDetails || {}), ...(body || {}) };
    await txn.save();
    res.json({ status: "success", donation: txn });
  })
);

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const filter = status ? { status } : {};
    const items = await DonationTransaction.find(filter)
      .populate("donorId", "fullName email phone tier totalDonated")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ status: "success", items });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const txn = await DonationTransaction.findById(req.params.id).populate("donorId");
    if (!txn) throw new AppError("Donation not found", 404);
    res.json({ status: "success", donation: txn });
  })
);

export default router;
