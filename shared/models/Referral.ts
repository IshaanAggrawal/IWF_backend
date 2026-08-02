import mongoose, { Schema, Document } from "mongoose";

export interface IReferralCode extends Document {
  code: string;
  memberId: string;
  active: boolean;
  clicks: number;
  donationsCount: number;
  donationsAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReferralCodeSchema = new Schema<IReferralCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    memberId: { type: String, required: true, index: true },
    active: { type: Boolean, default: true },
    clicks: { type: Number, default: 0 },
    donationsCount: { type: Number, default: 0 },
    donationsAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ReferralCode = mongoose.model<IReferralCode>("ReferralCode", ReferralCodeSchema);

export interface IReferralAttribution extends Document {
  code: string;
  memberId: string;
  donationTransactionId?: mongoose.Types.ObjectId;
  amount?: number;
  donorEmail?: string;
  status: "pending" | "converted";
  createdAt: Date;
  updatedAt: Date;
}

const ReferralAttributionSchema = new Schema<IReferralAttribution>(
  {
    code: { type: String, required: true, uppercase: true, index: true },
    memberId: { type: String, required: true, index: true },
    donationTransactionId: { type: Schema.Types.ObjectId, ref: "DonationTransaction" },
    amount: Number,
    donorEmail: String,
    status: { type: String, enum: ["pending", "converted"], default: "pending" },
  },
  { timestamps: true }
);

export const ReferralAttribution = mongoose.model<IReferralAttribution>(
  "ReferralAttribution",
  ReferralAttributionSchema
);
