import { Request, Response } from "express";
import { DonorTierConfig } from "@shared/models/DonorTierConfig";
import { asyncHandler } from "@shared/utils/asyncHandler";

export const getDonorTiers = asyncHandler(async (req: Request, res: Response) => {
  const tiers = await DonorTierConfig.find();
  res.json({ status: "success", data: tiers });
});

export const updateDonorTier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, minAmount, features, color } = req.body;
  const tier = await DonorTierConfig.findByIdAndUpdate(
    id,
    { name, minAmount, features, color },
    { new: true, runValidators: true }
  );
  if (!tier) {
    return res.status(404).json({ error: "Donor Tier not found" });
  }
  res.json({ status: "success", data: tier });
});
