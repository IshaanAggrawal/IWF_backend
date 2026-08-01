import mongoose, { Schema, Document } from "mongoose";

export interface IPatientCampaign extends Document {
  legacyId?: number;
  slug: string;
  name: string;
  age: number;
  gender: string;
  disease: string;
  diagnosis?: string;
  hospital: string;
  hospitalAddress?: string;
  ward?: string;
  admissionDate: string;
  condition: "Critical" | "Serious" | "Stable" | "Recovering" | "Discharged";
  urgent: boolean;
  image: string;
  neededAmount: number;
  raisedAmount: number;
  donorsCount: number;
  costBreakdown: { label: string; amount: number }[];
  verificationId: string;
  verifiedBy: string;
  verificationDate: string;
  documents: { label: string; type: string; verified: boolean }[];
  story: string[];
  familyBackground?: string;
  updates: { date: string; title: string; text: string; type: string }[];
  donationHistory: { donor: string; amount: number; date: string; message?: string }[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CostBreakdownSchema = new Schema(
  { label: { type: String }, amount: { type: Number } },
  { _id: false }
);

const DocumentSchema = new Schema(
  { label: { type: String }, type: { type: String }, verified: { type: Boolean } },
  { _id: false }
);

const UpdateSchema = new Schema(
  { date: { type: String }, title: { type: String }, text: { type: String }, type: { type: String } },
  { _id: false }
);

const DonationHistorySchema = new Schema(
  { donor: { type: String }, amount: { type: Number }, date: { type: String }, message: { type: String } },
  { _id: false }
);

const PatientCampaignSchema = new Schema<IPatientCampaign>(
  {
    legacyId: { type: Number },
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    disease: { type: String, required: true },
    diagnosis: { type: String },
    hospital: { type: String, required: true },
    hospitalAddress: { type: String },
    ward: { type: String },
    admissionDate: { type: String, required: true },
    condition: {
      type: String,
      enum: ["Critical", "Serious", "Stable", "Recovering", "Discharged"],
      required: true,
    },
    urgent: { type: Boolean, default: true },
    image: { type: String, required: true },
    neededAmount: { type: Number, required: true },
    raisedAmount: { type: Number, default: 0 },
    donorsCount: { type: Number, default: 0 },
    costBreakdown: { type: [CostBreakdownSchema], default: [] },
    verificationId: { type: String, required: true },
    verifiedBy: { type: String, required: true },
    verificationDate: { type: String, required: true },
    documents: { type: [DocumentSchema], default: [] },
    story: { type: [String], default: [] },
    familyBackground: { type: String },
    updates: { type: [UpdateSchema], default: [] },
    donationHistory: { type: [DonationHistorySchema], default: [] },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const PatientCampaign = mongoose.model<IPatientCampaign>("PatientCampaign", PatientCampaignSchema);
