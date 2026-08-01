import mongoose, { Schema, Document } from "mongoose";

export interface ISiteSettings extends Document {
  phone: string;
  email: string;
  address: string;
  upiId?: string;
  membershipUpiId?: string;
  offices: {
    type: string;
    badge: string;
    address: string;
    phone?: string;
    email?: string;
    timing?: string;
  }[];
  bankAccounts: {
    key: string;
    accountNo: string;
    accountName: string;
    bank: string;
    branch: string;
    ifsc: string;
    micr?: string;
    swift?: string;
    accountType: string;
  }[];
  legalRegistrations: { label: string; value: string }[];
  socials?: { platform: string; url: string }[];
  presetDonationAmounts: number[];
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    upiId: String,
    membershipUpiId: String,
    offices: [
      {
        type: { type: String },
        badge: String,
        address: String,
        phone: String,
        email: String,
        timing: String,
      },
    ],
    bankAccounts: [
      {
        key: String,
        accountNo: String,
        accountName: String,
        bank: String,
        branch: String,
        ifsc: String,
        micr: String,
        swift: String,
        accountType: String,
      },
    ],
    legalRegistrations: [{ label: String, value: String }],
    socials: [{ platform: String, url: String }],
    presetDonationAmounts: { type: [Number], default: [500, 1000, 2500, 5000, 10000] },
  },
  { timestamps: true }
);

export const SiteSettings = mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
