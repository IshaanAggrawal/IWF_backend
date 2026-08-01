import mongoose, { Schema, Document } from "mongoose";

export interface IMember extends Document {
  memberId: string;
  fullName: string;
  fatherName?: string;
  mobile: string;
  email: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  category: "Blue" | "Yellow" | "Green";
  categorySnapshot?: {
    name: "Blue" | "Yellow" | "Green";
    code: string;
    amount: number;
    features: string[];
    color?: string;
  };
  membershipPeriod: number;
  paymentDate?: string;
  consentDisplay: boolean;
  photoUrl?: string;
  idProofUrl?: string;
  status: "Active" | "Expired" | "Pending";
  validTill: string;
  joined: string;
  paymentMode?: string;
  paymentDetails?: {
    channel?: string;
    upiId?: string;
    bankReference?: string;
    transactionId?: string;
    notes?: string;
  };
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  transactionId?: string;
  amountPaid: number;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    memberId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    fatherName: String,
    mobile: { type: String, required: true, index: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    pincode: { type: String, required: true },
    category: { type: String, enum: ["Blue", "Yellow", "Green"], required: true },
    categorySnapshot: {
      name: { type: String, enum: ["Blue", "Yellow", "Green"] },
      code: String,
      amount: Number,
      features: [String],
      color: String,
    },
    membershipPeriod: { type: Number, required: true },
    paymentDate: String,
    consentDisplay: { type: Boolean, default: true },
    photoUrl: String,
    idProofUrl: String,
    status: { type: String, enum: ["Active", "Expired", "Pending"], default: "Pending" },
    validTill: { type: String, required: true },
    joined: { type: String, required: true },
    paymentMode: String,
    paymentDetails: {
      channel: String,
      upiId: String,
      bankReference: String,
      transactionId: String,
      notes: String,
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    transactionId: String,
    amountPaid: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Member = mongoose.model<IMember>("Member", MemberSchema);

export interface IMembershipApplication extends Document {
  fullName: string;
  fatherName?: string;
  mobile: string;
  email: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  /** Membership card choice: Blue / Yellow / Green */
  category: "Blue" | "Yellow" | "Green";
  /** Snapshot of card at application time */
  categorySnapshot: {
    name: "Blue" | "Yellow" | "Green";
    code: string;
    amount: number;
    features: string[];
    color?: string;
  };
  membershipPeriod: number;
  paymentDate?: string;
  consentDisplay: boolean;
  photoUrl?: string;
  idProofUrl?: string;
  paymentMode: string;
  paymentDetails?: {
    channel?: string;
    upiId?: string;
    bankReference?: string;
    transactionId?: string;
    notes?: string;
  };
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  convenienceFee: number;
  status: "pending" | "paid" | "approved" | "rejected";
  memberId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipApplicationSchema = new Schema<IMembershipApplication>(
  {
    fullName: { type: String, required: true },
    fatherName: String,
    mobile: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    pincode: { type: String, required: true },
    category: { type: String, enum: ["Blue", "Yellow", "Green"], required: true },
    categorySnapshot: {
      name: { type: String, enum: ["Blue", "Yellow", "Green"] },
      code: String,
      amount: Number,
      features: [String],
      color: String,
    },
    membershipPeriod: { type: Number, required: true },
    paymentDate: String,
    consentDisplay: { type: Boolean, default: true },
    photoUrl: String,
    idProofUrl: String,
    paymentMode: { type: String, required: true },
    paymentDetails: {
      channel: String,
      upiId: String,
      bankReference: String,
      transactionId: String,
      notes: String,
    },
    transactionId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    amount: { type: Number, required: true },
    convenienceFee: { type: Number, default: 50 },
    status: {
      type: String,
      enum: ["pending", "paid", "approved", "rejected"],
      default: "pending",
    },
    memberId: String,
  },
  { timestamps: true }
);

export const MembershipApplication = mongoose.model<IMembershipApplication>(
  "MembershipApplication",
  MembershipApplicationSchema
);

export interface IOtpChallenge extends Document {
  identifier: string;
  otp: string;
  purpose: "lookup" | "renew";
  expiresAt: Date;
  verified: boolean;
}

const OtpChallengeSchema = new Schema<IOtpChallenge>(
  {
    identifier: { type: String, required: true },
    otp: { type: String, required: true },
    purpose: { type: String, enum: ["lookup", "renew"], required: true },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const OtpChallenge = mongoose.model<IOtpChallenge>("OtpChallenge", OtpChallengeSchema);
