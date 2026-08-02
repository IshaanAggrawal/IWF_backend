import { Request, Response } from "express";
import { Donor } from "@shared/models/Donor";
import { processDonationInitialization, verifyAndCompleteDonation } from "../services/paymentService";

export const initializeDonation = async (req: Request, res: Response) => {
  try {
    const result = await processDonationInitialization(req.body);
    res.status(200).json({ 
      success: true, 
      ...result 
    });
  } catch (error) {
    console.error("Error initializing donation:", error);
    res.status(500).json({ error: "Server error initializing donation" });
  }
};

export const verifyDonation = async (req: Request, res: Response) => {
  try {
    const result = await verifyAndCompleteDonation(req.body);
    res.status(200).json({ 
      success: true, 
      message: "Payment verified successfully",
      ...result
    });
  } catch (error: any) {
    console.error("Error verifying donation:", error);
    if (error.message === "Invalid payment signature" || error.message === "Transaction not found") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error verifying donation" });
  }
};

export const getDonors = async (req: Request, res: Response) => {
  try {
    const donors = await Donor.find().sort({ totalDonated: -1 }).limit(50);
    res.status(200).json({ success: true, data: donors });
  } catch (error) {
    console.error("Error fetching donors:", error);
    res.status(500).json({ error: "Server error fetching donors" });
  }
};
