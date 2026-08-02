import crypto from "crypto";
import { z } from "zod";
import { Member, MembershipApplication, OtpChallenge } from "@shared/models/Member";
import { MembershipCategory } from "@shared/models/CmsContent";
import { AppError } from "@shared/utils/AppError";
import { generateMemberId } from "@shared/utils/receiptNo";
import { sendMembershipOtpEmail } from "@services/communication/src/services/emailService";

const categoryDefaults = {
  Blue: { name: "Blue" as const, code: "BLU", amount: 500, features: ["Basic membership"], color: "#2563eb" },
  Yellow: { name: "Yellow" as const, code: "YLW", amount: 1000, features: ["Supporting membership"], color: "#ca8a04" },
  Green: { name: "Green" as const, code: "GRN", amount: 2500, features: ["Patron membership"], color: "#16a34a" },
};

const identifierSchema = z.string().trim().min(3).transform((value) => value.toLowerCase());

const otpRequestSchema = z.object({
  identifier: identifierSchema,
  purpose: z.enum(["lookup", "renew"]).default("lookup"),
});

const otpVerifySchema = otpRequestSchema.extend({
  otp: z.string().trim().length(6),
});

const renewalSchema = z.object({
  identifier: identifierSchema,
  membershipPeriod: z.coerce.number().int().positive().default(1),
  paymentMode: z.string().trim().min(1),
  amount: z.coerce.number().positive(),
  paymentDetails: z
    .object({
      channel: z.string().trim().optional(),
      upiId: z.string().trim().optional(),
      bankReference: z.string().trim().optional(),
      transactionId: z.string().trim().optional(),
      notes: z.string().trim().optional(),
    })
    .optional(),
});

const addYears = (date: Date, years: number) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
};

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const resolveCategorySnapshot = async (category: "Blue" | "Yellow" | "Green") => {
  const configured = await MembershipCategory.findOne({ name: category, published: true }).lean();
  return configured
    ? {
        name: configured.name,
        code: configured.code,
        amount: configured.amount,
        features: configured.features,
        color: configured.color,
      }
    : categoryDefaults[category];
};

const findMemberByIdentifier = async (identifier: string) =>
  Member.findOne({
    $or: [{ email: identifier }, { mobile: identifier }, { memberId: identifier.toUpperCase() }],
  });

const ensureVerifiedOtp = async (identifier: string, purpose: "lookup" | "renew") => {
  const challenge = await OtpChallenge.findOne({
    identifier,
    purpose,
    verified: true,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!challenge) throw new AppError("OTP verification required", 401);
  return challenge;
};

export const processMembershipApplication = async (data: any) => {
  const categorySnapshot = await resolveCategorySnapshot(data.category);
  const application = await MembershipApplication.create({
    ...data,
    categorySnapshot,
    status: "pending",
  });
  return application;
};

export const issueMemberFromApplication = async (applicationId: string) => {
  const application = await MembershipApplication.findById(applicationId);
  if (!application) throw new AppError("Membership application not found", 404);

  const existing = application.memberId ? await Member.findOne({ memberId: application.memberId }) : null;
  if (existing) return existing;

  const seq = (await Member.countDocuments({ category: application.category })) + 1;
  const memberId = generateMemberId(application.categorySnapshot?.code || categoryDefaults[application.category].code, seq);
  const joined = toDateString(new Date());
  const validTill = toDateString(addYears(new Date(), application.membershipPeriod));

  const member = await Member.create({
    memberId,
    fullName: application.fullName,
    fatherName: application.fatherName,
    mobile: application.mobile,
    email: application.email,
    address: application.address,
    state: application.state,
    district: application.district,
    pincode: application.pincode,
    category: application.category,
    categorySnapshot: application.categorySnapshot,
    membershipPeriod: application.membershipPeriod,
    paymentDate: application.paymentDate || joined,
    consentDisplay: application.consentDisplay,
    photoUrl: application.photoUrl,
    idProofUrl: application.idProofUrl,
    status: "Active",
    validTill,
    joined,
    paymentMode: application.paymentMode,
    paymentDetails: application.paymentDetails,
    razorpayOrderId: application.razorpayOrderId,
    razorpayPaymentId: application.razorpayPaymentId,
    transactionId: application.transactionId,
    amountPaid: application.amount + application.convenienceFee,
  });

  application.status = "approved";
  application.memberId = memberId;
  await application.save();
  return member;
};

export const requestMembershipOtp = async (data: unknown) => {
  const { identifier, purpose } = otpRequestSchema.parse(data);
  const member = await findMemberByIdentifier(identifier);
  if (!member) throw new AppError("Member not found", 404);

  const otp = generateOtp();
  await OtpChallenge.create({
    identifier,
    purpose,
    otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    verified: false,
  });

  await sendMembershipOtpEmail(member.email, otp, purpose);
  return { identifier, purpose, expiresInMinutes: 10 };
};

export const verifyMembershipOtp = async (data: unknown) => {
  const { identifier, purpose, otp } = otpVerifySchema.parse(data);
  const challenge = await OtpChallenge.findOne({
    identifier,
    purpose,
    otp,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!challenge) throw new AppError("Invalid or expired OTP", 400);
  challenge.verified = true;
  await challenge.save();

  const member = await findMemberByIdentifier(identifier);
  return { verified: true, member };
};

export const getVerifiedMembershipStatus = async (identifierInput: unknown) => {
  const identifier = identifierSchema.parse(identifierInput);
  await ensureVerifiedOtp(identifier, "lookup");
  const member = await findMemberByIdentifier(identifier);
  if (!member) throw new AppError("Member not found", 404);
  return member;
};

export const renewVerifiedMembership = async (data: unknown) => {
  const payload = renewalSchema.parse(data);
  await ensureVerifiedOtp(payload.identifier, "renew");
  const member = await findMemberByIdentifier(payload.identifier);
  if (!member) throw new AppError("Member not found", 404);

  const currentValidTill = new Date(member.validTill);
  const renewalBase = Number.isNaN(currentValidTill.getTime()) || currentValidTill < new Date() ? new Date() : currentValidTill;
  member.membershipPeriod = payload.membershipPeriod;
  member.validTill = toDateString(addYears(renewalBase, payload.membershipPeriod));
  member.status = "Active";
  member.paymentMode = payload.paymentMode;
  member.paymentDetails = payload.paymentDetails;
  member.paymentDate = toDateString(new Date());
  member.amountPaid += payload.amount;
  await member.save();

  return member;
};

export const getMembershipCardPayload = async (memberId: string) => {
  const member = await Member.findOne({ memberId: memberId.toUpperCase() });
  if (!member) throw new AppError("Member not found", 404);
  return member;
};

export const getMembershipFeeReceiptPayload = async (memberId: string) => {
  const member = await getMembershipCardPayload(memberId);
  return {
    member,
    receiptNo: `IWF-MEM-${member.memberId}-${new Date().getFullYear()}`,
    amount: member.amountPaid,
  };
};
