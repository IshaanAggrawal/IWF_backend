import { Router } from "express";
import multer from "multer";
import Razorpay from "razorpay";
import crypto from "crypto";
import { z } from "zod";
import { Member, MembershipApplication, OtpChallenge } from "../../../shared/models/Member";
import { MembershipCategory } from "../../../shared/models/CmsContent";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { AppError } from "../../../shared/utils/AppError";
import { generateMemberId } from "../../../shared/utils/receiptNo";
import { uploadBuffer } from "../../../infrastructure/storage/cloudinary";
import { requireAuth } from "../../../shared/middlewares/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const DEV_OTP = "1234";
const CONVENIENCE_FEE = 50;

function getRazorpay(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || keyId.includes("YOUR_")) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

function addYears(date: Date, years: number): string {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

const applicationSchema = z.object({
  fullName: z.string().min(2),
  fatherName: z.string().optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email(),
  address: z.string().min(5),
  state: z.string().min(1),
  district: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/),
  category: z.enum(["Blue", "Yellow", "Green"]),
  membershipPeriod: z.coerce.number().min(1).max(2),
  paymentDate: z.string().optional(),
  consentDisplay: z.coerce.boolean(),
  paymentMode: z.string().min(1),
  transactionId: z.string().optional(),
  paymentDetails: z
    .object({
      channel: z.string().optional(),
      upiId: z.string().optional(),
      bankReference: z.string().optional(),
      transactionId: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

router.post(
  "/applications",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "idProof", maxCount: 1 },
  ]),
  asyncHandler(async (req, res) => {
    let paymentDetails = req.body.paymentDetails;
    if (typeof paymentDetails === "string") {
      try {
        paymentDetails = JSON.parse(paymentDetails);
      } catch {
        paymentDetails = undefined;
      }
    }

    const data = applicationSchema.parse({ ...req.body, paymentDetails });
    const category = await MembershipCategory.findOne({ name: data.category, published: true });
    const baseAmount =
      category?.amount ?? (data.category === "Blue" ? 2500 : data.category === "Yellow" ? 4000 : 6000);
    const amount = baseAmount * data.membershipPeriod + CONVENIENCE_FEE;

    const categorySnapshot = {
      name: data.category,
      code: category?.code ?? (data.category === "Blue" ? "BL" : data.category === "Yellow" ? "YL" : "GR"),
      amount: baseAmount,
      features: category?.features ?? [],
      color: category?.color,
    };

    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
    let photoUrl: string | undefined;
    let idProofUrl: string | undefined;

    if (files?.photo?.[0]) {
      const up = await uploadBuffer(
        files.photo[0].buffer,
        files.photo[0].originalname,
        "membership/photos",
        files.photo[0].mimetype
      );
      photoUrl = up.url;
    }
    if (files?.idProof?.[0]) {
      const up = await uploadBuffer(
        files.idProof[0].buffer,
        files.idProof[0].originalname,
        "membership/ids",
        files.idProof[0].mimetype
      );
      idProofUrl = up.url;
    }

    const application = await MembershipApplication.create({
      ...data,
      amount,
      convenienceFee: CONVENIENCE_FEE,
      categorySnapshot,
      photoUrl,
      idProofUrl,
      paymentDetails: data.paymentDetails || (data.transactionId ? { transactionId: data.transactionId } : undefined),
      status: "pending",
    });

    res.status(201).json({
      status: "success",
      application,
      membershipCard: categorySnapshot,
      amountBreakdown: {
        cardFee: baseAmount,
        years: data.membershipPeriod,
        convenienceFee: CONVENIENCE_FEE,
        total: amount,
      },
      razorpayKeyId: process.env.RAZORPAY_KEY_ID?.includes("YOUR_")
        ? null
        : process.env.RAZORPAY_KEY_ID || null,
      note: "Membership cards are Blue/Yellow/Green. Donor recognition cards (Silver/Gold/Platinum) are separate — see GET /api/donations/tiers.",
    });
  })
);

router.post(
  "/applications/:id/create-order",
  asyncHandler(async (req, res) => {
    const app = await MembershipApplication.findById(req.params.id);
    if (!app) throw new AppError("Application not found", 404);

    const razorpay = getRazorpay();
    if (!razorpay) {
      const mockOrderId = `order_mem_test_${app.id}`;
      app.razorpayOrderId = mockOrderId;
      await app.save();
      return res.json({
        status: "success",
        order: { id: mockOrderId, amount: app.amount * 100, currency: "INR", mock: true },
        keyId: null,
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(app.amount * 100),
      currency: "INR",
      receipt: `mem_${app.id}`,
      notes: { applicationId: app.id },
    });
    app.razorpayOrderId = order.id;
    await app.save();
    res.json({ status: "success", order, keyId: process.env.RAZORPAY_KEY_ID });
  })
);

router.post(
  "/applications/:id/verify",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string().optional(),
      transactionId: z.string().optional(),
    });
    const body = schema.parse(req.body);
    const app = await MembershipApplication.findById(req.params.id);
    if (!app) throw new AppError("Application not found", 404);

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const isMock = body.razorpay_order_id.includes("_test_");
    if (!isMock && keySecret && !keySecret.includes("YOUR_") && body.razorpay_signature) {
      const expected = crypto
        .createHmac("sha256", keySecret)
        .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
        .digest("hex");
      if (expected !== body.razorpay_signature) throw new AppError("Signature verification failed", 400);
    }

    app.status = "paid";
    app.razorpayPaymentId = body.razorpay_payment_id;
    if (body.transactionId) app.transactionId = body.transactionId;

    const cat = await MembershipCategory.findOne({ name: app.category });
    const code = cat?.code ?? (app.category === "Blue" ? "BL" : app.category === "Yellow" ? "YL" : "GR");
    const count = await Member.countDocuments({ category: app.category });
    const memberId = generateMemberId(code, count + 1);
    const joined = new Date().toISOString().slice(0, 10);
    const validTill = addYears(new Date(), app.membershipPeriod);

    const member = await Member.create({
      memberId,
      fullName: app.fullName,
      fatherName: app.fatherName,
      mobile: app.mobile,
      email: app.email,
      address: app.address,
      state: app.state,
      district: app.district,
      pincode: app.pincode,
      category: app.category,
      categorySnapshot: app.categorySnapshot,
      membershipPeriod: app.membershipPeriod,
      paymentDate: app.paymentDate || joined,
      consentDisplay: app.consentDisplay,
      photoUrl: app.photoUrl,
      idProofUrl: app.idProofUrl,
      status: "Active",
      validTill,
      joined,
      paymentMode: app.paymentMode,
      paymentDetails: app.paymentDetails,
      razorpayOrderId: app.razorpayOrderId,
      razorpayPaymentId: app.razorpayPaymentId,
      transactionId: app.transactionId,
      amountPaid: app.amount,
    });

    app.memberId = memberId;
    app.status = "approved";
    await app.save();

    res.json({
      status: "success",
      application: app,
      member,
      membershipCard: app.categorySnapshot || { name: app.category },
    });
  })
);

router.post(
  "/lookup",
  asyncHandler(async (req, res) => {
    const schema = z.object({ identifier: z.string().min(3) });
    const { identifier } = schema.parse(req.body);
    const member = await Member.findOne({
      $or: [{ memberId: identifier.toUpperCase() }, { mobile: identifier }],
    });
    if (!member) throw new AppError("Member not found", 404);

    const otp = process.env.NODE_ENV === "production" ? String(Math.floor(1000 + Math.random() * 9000)) : DEV_OTP;
    await OtpChallenge.create({
      identifier: member.memberId,
      otp,
      purpose: "lookup",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    res.json({
      status: "success",
      message: "OTP sent",
      memberId: member.memberId,
      // Dev only — never expose in production SMS flow
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
    });
  })
);

router.post(
  "/lookup/verify",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      memberId: z.string(),
      otp: z.string().min(4),
    });
    const { memberId, otp } = schema.parse(req.body);
    const challenge = await OtpChallenge.findOne({
      identifier: memberId,
      purpose: "lookup",
      verified: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!challenge || challenge.otp !== otp) throw new AppError("Invalid or expired OTP", 400);
    challenge.verified = true;
    await challenge.save();

    const member = await Member.findOne({ memberId });
    if (!member) throw new AppError("Member not found", 404);
    res.json({ status: "success", member });
  })
);

router.post(
  "/renew",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      memberId: z.string(),
      membershipPeriod: z.coerce.number().min(1).max(2),
      otp: z.string().min(4),
    });
    const data = schema.parse(req.body);
    const challenge = await OtpChallenge.findOne({
      identifier: data.memberId,
      purpose: { $in: ["lookup", "renew"] },
      verified: true,
    }).sort({ createdAt: -1 });
    if (!challenge && data.otp !== DEV_OTP) throw new AppError("OTP verification required", 400);

    const member = await Member.findOne({ memberId: data.memberId });
    if (!member) throw new AppError("Member not found", 404);

    const category = await MembershipCategory.findOne({ name: member.category });
    const base = category?.amount ?? 2500;
    const amount = base * data.membershipPeriod + CONVENIENCE_FEE;

    res.json({
      status: "success",
      renewal: {
        memberId: member.memberId,
        category: member.category,
        membershipPeriod: data.membershipPeriod,
        amount,
        currentValidTill: member.validTill,
      },
    });
  })
);

router.post(
  "/renew/confirm",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      memberId: z.string(),
      membershipPeriod: z.coerce.number().min(1).max(2),
      razorpay_payment_id: z.string().optional(),
      transactionId: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const member = await Member.findOne({ memberId: data.memberId });
    if (!member) throw new AppError("Member not found", 404);

    const baseDate = new Date(Math.max(Date.now(), new Date(member.validTill).getTime()));
    member.validTill = addYears(baseDate, data.membershipPeriod);
    member.membershipPeriod = data.membershipPeriod;
    member.status = "Active";
    if (data.razorpay_payment_id) member.razorpayPaymentId = data.razorpay_payment_id;
    if (data.transactionId) member.transactionId = data.transactionId;
    await member.save();

    res.json({ status: "success", member });
  })
);

router.get(
  "/",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const members = await Member.find().sort({ createdAt: -1 }).limit(200);
    res.json({ status: "success", members });
  })
);

export default router;
