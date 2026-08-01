import mongoose, { Schema, Document } from "mongoose";

/**
 * Configurable donor recognition card thresholds (Silver / Gold / Platinum).
 * Membership cards stay on MembershipCategory (Blue / Yellow / Green).
 */
export interface IDonorTierConfig extends Document {
  key: "default";
  tiers: {
    name: "Silver" | "Gold" | "Platinum";
    minAmount: number;
    color?: string;
    label?: string;
  }[];
  updatedAt: Date;
  createdAt: Date;
}

const DonorTierConfigSchema = new Schema<IDonorTierConfig>(
  {
    key: { type: String, enum: ["default"], unique: true, default: "default" },
    tiers: [
      {
        name: { type: String, enum: ["Silver", "Gold", "Platinum"], required: true },
        minAmount: { type: Number, required: true },
        color: String,
        label: String,
      },
    ],
  },
  { timestamps: true }
);

export const DonorTierConfig = mongoose.model<IDonorTierConfig>("DonorTierConfig", DonorTierConfigSchema);

export function cardTierFromAmount(
  amount: number,
  tiers?: { name: "Silver" | "Gold" | "Platinum"; minAmount: number }[]
): "Platinum" | "Gold" | "Silver" {
  const list = [...(tiers || [
    { name: "Platinum" as const, minAmount: 50000 },
    { name: "Gold" as const, minAmount: 10000 },
    { name: "Silver" as const, minAmount: 1 },
  ])].sort((a, b) => b.minAmount - a.minAmount);

  for (const t of list) {
    if (amount >= t.minAmount) return t.name;
  }
  return "Silver";
}
