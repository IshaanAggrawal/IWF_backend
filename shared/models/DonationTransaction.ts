import mongoose, { Schema, Document } from "mongoose";

/**
 * Donation form + payment record.
 *
 * Donor recognition cards (NOT membership):
 * - Silver  : amount >= 1 (default recognition)
 * - Gold    : amount >= 10000
 * - Platinum: amount >= 50000
 *
 * Membership cards are separate: Blue / Yellow / Green on Member models.
 */
export interface IPaymentDetails {
  /** online subtype when known */
  channel?: "upi" | "card" | "netbanking" | "wallet" | "unknown";
  upiId?: string;
  bankReference?: string; // NEFT/IMPS/UTR
  chequeNumber?: string;
  chequeDate?: string;
  chequeBank?: string;
  notes?: string;
}

export interface IDonationFormSnapshot {
  donorType: "individual" | "corporate" | "institution";
  citizenship: "indian" | "foreign";
  fullName: string;
  email: string;
  phone: string;
  address: string;
  pan?: string;
  taxExemption: boolean;
  consentDisplay: boolean;
  financialType: string;
  amount: number;
  paymentMode: "online" | "bank" | "offline";
  patientSlug?: string;
}

export interface IDonationTransaction extends Document {
  donorId: mongoose.Types.ObjectId;
  patientId?: mongoose.Types.ObjectId;
  amount: number;
  financialType: string;
  paymentMode: "online" | "bank" | "offline";
  taxExemption: boolean;
  consentDisplay: boolean;
  /** Card shown on receipt for THIS donation */
  donorCardTier: "Platinum" | "Gold" | "Silver";
  formSnapshot: IDonationFormSnapshot;
  paymentDetails?: IPaymentDetails;
  referralCode?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: "pending" | "success" | "failed";
  receiptNo?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentDetailsSchema = new Schema(
  {
    channel: { type: String, enum: ["upi", "card", "netbanking", "wallet", "unknown"] },
    upiId: String,
    bankReference: String,
    chequeNumber: String,
    chequeDate: String,
    chequeBank: String,
    notes: String,
  },
  { _id: false }
);

const FormSnapshotSchema = new Schema(
  {
    donorType: String,
    citizenship: String,
    fullName: String,
    email: String,
    phone: String,
    address: String,
    pan: String,
    taxExemption: Boolean,
    consentDisplay: Boolean,
    financialType: String,
    amount: Number,
    paymentMode: String,
    patientSlug: String,
  },
  { _id: false }
);

const DonationTransactionSchema = new Schema<IDonationTransaction>(
  {
    donorId: { type: Schema.Types.ObjectId, ref: "Donor", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "PatientCampaign", required: false },
    amount: { type: Number, required: true },
    financialType: { type: String, required: true },
    paymentMode: { type: String, enum: ["online", "bank", "offline"], required: true },
    taxExemption: { type: Boolean, default: false },
    consentDisplay: { type: Boolean, default: false },
    donorCardTier: {
      type: String,
      enum: ["Platinum", "Gold", "Silver"],
      required: true,
    },
    formSnapshot: { type: FormSnapshotSchema, required: true },
    paymentDetails: { type: PaymentDetailsSchema },
    referralCode: { type: String, required: false, uppercase: true, index: true },
    razorpayOrderId: { type: String, required: false },
    razorpayPaymentId: { type: String, required: false },
    razorpaySignature: { type: String, required: false },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    receiptNo: { type: String, required: false, unique: true, sparse: true },
    receiptUrl: { type: String, required: false },
  },
  { timestamps: true }
);

export const DonationTransaction = mongoose.model<IDonationTransaction>(
  "DonationTransaction",
  DonationTransactionSchema
);
