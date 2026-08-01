import mongoose, { Schema, Document } from "mongoose";

/**
 * Lifetime donor recognition (Silver / Gold / Platinum).
 * Separate from membership cards (Blue / Yellow / Green).
 */
export interface IDonor extends Document {
  donorType: "individual" | "corporate" | "institution";
  citizenship: "indian" | "foreign";
  fullName: string;
  email: string;
  phone: string;
  address: string;
  pan?: string;
  /** Lifetime recognition card based on totalDonated */
  tier: "Platinum" | "Gold" | "Silver" | "None";
  totalDonated: number;
  consentDisplay: boolean;
  lastDonationAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DonorSchema = new Schema<IDonor>(
  {
    donorType: { type: String, enum: ["individual", "corporate", "institution"], required: true },
    citizenship: { type: String, enum: ["indian", "foreign"], required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    pan: { type: String, required: false },
    tier: { type: String, enum: ["Platinum", "Gold", "Silver", "None"], default: "None" },
    totalDonated: { type: Number, default: 0 },
    consentDisplay: { type: Boolean, default: false },
    lastDonationAt: Date,
  },
  { timestamps: true }
);

export const Donor = mongoose.model<IDonor>("Donor", DonorSchema);
