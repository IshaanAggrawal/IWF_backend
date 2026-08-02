import Razorpay from "razorpay";
import crypto from "crypto";
import { z } from "zod";
import { DonationTransaction, IDonationTransaction } from "@shared/models/DonationTransaction";
import { Donor } from "@shared/models/Donor";
import { PatientCampaign } from "@shared/models/PatientCampaign";
import { ReferralAttribution, ReferralCode } from "@shared/models/Referral";
import { sendReceiptEmail } from "@services/communication/src/services/emailService";
import { AppError } from "@shared/utils/AppError";
import { generateReceiptNo } from "@shared/utils/receiptNo";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_fallback",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "fallback_secret",
});

const booleanField = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

const paymentDetailsSchema = z
  .object({
    channel: z.enum(["upi", "card", "netbanking", "wallet", "unknown"]).optional(),
    upiId: z.string().trim().optional(),
    bankReference: z.string().trim().optional(),
    chequeNumber: z.string().trim().optional(),
    chequeDate: z.string().trim().optional(),
    chequeBank: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .optional();

const donationInitSchema = z
  .object({
    amount: z.coerce.number().positive(),
    donorType: z.enum(["individual", "corporate", "institution"]),
    citizenship: z.enum(["indian", "foreign"]),
    fullName: z.string().trim().min(2),
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    phone: z.string().trim().min(7),
    address: z.string().trim().min(5),
    pan: z.string().trim().optional(),
    taxExemption: booleanField.default(false),
    consentDisplay: booleanField.default(false),
    financialType: z.string().trim().min(1),
    paymentMode: z.enum(["online", "bank", "offline"]).default("online"),
    patientSlug: z.string().trim().optional(),
    referralCode: z.string().trim().optional(),
    paymentDetails: paymentDetailsSchema,
  })
  .superRefine((value, ctx) => {
    if (value.taxExemption && !value.pan) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pan"],
        message: "PAN is required when tax exemption is requested",
      });
    }
  });

const donationVerifySchema = z.object({
  razorpay_order_id: z.string().trim().min(1),
  razorpay_payment_id: z.string().trim().min(1),
  razorpay_signature: z.string().trim().min(1),
  transactionId: z.string().trim().min(1),
});

const getDonationCardTier = (amount: number): IDonationTransaction["donorCardTier"] => {
  if (amount >= 50000) return "Platinum";
  if (amount >= 10000) return "Gold";
  return "Silver";
};

const getLifetimeDonorTier = (totalDonated: number) => {
  if (totalDonated >= 50000) return "Platinum";
  if (totalDonated >= 10000) return "Gold";
  if (totalDonated > 0) return "Silver";
  return "None";
};

export const processDonationInitialization = async (data: any) => {
  const payload = donationInitSchema.parse(data);
  const {
    amount,
    donorType,
    citizenship,
    fullName,
    email,
    phone,
    address,
    financialType,
    paymentMode,
    taxExemption,
    consentDisplay,
    pan,
    patientSlug,
    referralCode,
    paymentDetails,
  } = payload;

  const patient = patientSlug ? await PatientCampaign.findOne({ slug: patientSlug }) : null;
  if (patientSlug && !patient) throw new AppError("Patient campaign not found", 404);

  const normalizedReferralCode = referralCode?.toUpperCase();
  const referral = normalizedReferralCode
    ? await ReferralCode.findOne({ code: normalizedReferralCode, active: true })
    : null;
  if (normalizedReferralCode && !referral) throw new AppError("Referral code not found", 404);

  let donor = await Donor.findOne({ email });
  if (!donor) {
    donor = await Donor.create({
      donorType,
      citizenship,
      fullName,
      email,
      phone,
      address,
      consentDisplay,
      pan: taxExemption ? pan : undefined,
    });
  } else {
    donor.donorType = donorType;
    donor.citizenship = citizenship;
    donor.fullName = fullName;
    donor.phone = phone;
    donor.address = address;
    donor.consentDisplay = donor.consentDisplay || consentDisplay;
    if (taxExemption && pan && !donor.pan) donor.pan = pan;
    await donor.save();
  }

  const transaction = await DonationTransaction.create({
    donorId: donor._id,
    patientId: patient?._id,
    amount,
    financialType,
    paymentMode,
    taxExemption,
    consentDisplay,
    donorCardTier: getDonationCardTier(amount),
    formSnapshot: {
      donorType,
      citizenship,
      fullName,
      email,
      phone,
      address,
      pan: taxExemption ? pan : undefined,
      taxExemption,
      consentDisplay,
      financialType,
      amount,
      paymentMode,
      patientSlug,
    },
    paymentDetails,
    referralCode: normalizedReferralCode,
    status: "pending",
  });

  if (referral) {
    await ReferralAttribution.create({
      code: referral.code,
      memberId: referral.memberId,
      donationTransactionId: transaction._id,
      amount,
      donorEmail: email,
      status: "pending",
    });
  }

  if (paymentMode !== "online") {
    return { transactionId: transaction._id, amount: transaction.amount, paymentMode };
  }

  const options = {
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: transaction._id.toString(),
    payment_capture: 1,
  };

  try {
    const order = await razorpay.orders.create(options);
    transaction.razorpayOrderId = order.id;
    await transaction.save();

    return { orderId: order.id, transactionId: transaction._id, amount: order.amount };
  } catch (error) {
    transaction.status = "failed";
    await transaction.save();
    throw new AppError("Unable to create payment order", 502);
  }
};

export const verifyAndCompleteDonation = async (data: any) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } =
    donationVerifySchema.parse(data);

  const transaction = await DonationTransaction.findById(transactionId);
  if (!transaction) throw new AppError("Transaction not found", 404);
  if (transaction.paymentMode !== "online") throw new AppError("Only online donations can be verified", 400);
  if (!transaction.razorpayOrderId) throw new AppError("Payment order was not created", 400);
  if (transaction.razorpayOrderId !== razorpay_order_id) throw new AppError("Payment order mismatch", 400);
  if (transaction.status === "success" && transaction.receiptNo) return { receiptNo: transaction.receiptNo };

  const secret = process.env.RAZORPAY_KEY_SECRET || "fallback_secret";
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    transaction.status = "failed";
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    await transaction.save();
    throw new AppError("Invalid payment signature", 400);
  }

  let completedTransaction: IDonationTransaction | null = null;
  for (let attempt = 0; attempt < 3 && !completedTransaction; attempt += 1) {
    try {
      completedTransaction = await DonationTransaction.findOneAndUpdate(
        { _id: transaction._id, status: "pending" },
        {
          $set: {
            status: "success",
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            receiptNo: generateReceiptNo(),
          },
        },
        { new: true, runValidators: true }
      );
    } catch (error: any) {
      if (error?.code !== 11000 || attempt === 2) throw error;
    }
  }

  if (!completedTransaction) {
    const latest = await DonationTransaction.findById(transaction._id);
    if (latest?.status === "success" && latest.receiptNo) return { receiptNo: latest.receiptNo };
    throw new AppError("Payment could not be completed", 409);
  }
  if (!completedTransaction.receiptNo) throw new AppError("Receipt number was not generated", 500);

  const receiptNo = completedTransaction.receiptNo;

  const donor = await Donor.findById(completedTransaction.donorId);
  if (donor) {
    donor.totalDonated += completedTransaction.amount;
    donor.tier = getLifetimeDonorTier(donor.totalDonated);
    donor.lastDonationAt = new Date();
    await donor.save();
    sendReceiptEmail(donor.email, receiptNo, completedTransaction.amount).catch(console.error);
  }

  if (completedTransaction.patientId) {
    await PatientCampaign.findByIdAndUpdate(completedTransaction.patientId, {
      $inc: { raisedAmount: completedTransaction.amount, donorsCount: 1 },
      $push: {
        donationHistory: {
          donor: completedTransaction.consentDisplay ? completedTransaction.formSnapshot.fullName : "Anonymous",
          amount: completedTransaction.amount,
          date: new Date().toISOString(),
        },
      },
    });
  }

  if (completedTransaction.referralCode) {
    const attribution = await ReferralAttribution.findOneAndUpdate(
      { donationTransactionId: completedTransaction._id },
      { $set: { status: "converted", amount: completedTransaction.amount } },
      { new: true }
    );
    if (attribution) {
      await ReferralCode.findOneAndUpdate(
        { code: attribution.code },
        { $inc: { donationsCount: 1, donationsAmount: completedTransaction.amount } }
      );
    }
  }

  return { receiptNo };
};
