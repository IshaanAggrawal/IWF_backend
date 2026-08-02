import { Request, Response } from "express";
import { Donor } from "@shared/models/Donor";
import { DonationTransaction } from "@shared/models/DonationTransaction";
import { processDonationInitialization, verifyAndCompleteDonation } from "../services/paymentService";
import { AppError } from "@shared/utils/AppError";
import { ZodError } from "zod";

const sendPaymentError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ status: "error", error: error.message });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      error: "Validation failed",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  return res.status(500).json({ status: "error", error: fallbackMessage });
};

export const initializeDonation = async (req: Request, res: Response) => {
  try {
    const result = await processDonationInitialization(req.body);
    res.status(200).json({ 
      success: true, 
      ...result 
    });
  } catch (error) {
    console.error("Error initializing donation:", error);
    return sendPaymentError(res, error, "Server error initializing donation");
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
    return sendPaymentError(res, error, "Server error verifying donation");
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

export const getReceipt = async (req: Request, res: Response) => {
  try {
    const { receiptNo, email } = req.query;
    const filter: Record<string, unknown> = { status: "success" };
    if (receiptNo) filter.receiptNo = receiptNo;

    let transactions;
    if (email) {
      const donor = await Donor.findOne({ email: String(email).toLowerCase() });
      if (!donor) return res.status(404).json({ error: "Receipt not found" });
      filter.donorId = donor._id;
    }

    transactions = await DonationTransaction.find(filter).sort({ createdAt: -1 }).populate("donorId");
    if (!transactions.length) return res.status(404).json({ error: "Receipt not found" });
    res.status(200).json({ success: true, data: receiptNo ? transactions[0] : transactions });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    res.status(500).json({ error: "Server error fetching receipt" });
  }
};

export const downloadDonorCard = async (req: Request, res: Response) => {
  try {
    const transaction = await DonationTransaction.findById(req.params.transactionId).populate("donorId");
    if (!transaction || transaction.status !== "success") return res.status(404).json({ error: "Donation not found" });

    const donor: any = transaction.donorId;
    res.status(200).json({
      success: true,
      message: "Donor card data fetched successfully",
      data: {
        organization: "Islah Welfare Foundation",
        documentType: "donor_card",
        transactionId: transaction._id,
        donorName: donor.fullName,
        donorEmail: donor.email,
        donorCardTier: transaction.donorCardTier,
        amount: transaction.amount,
        receiptNo: transaction.receiptNo,
        donationDate: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("Error generating donor card:", error);
    res.status(500).json({ error: "Server error generating donor card" });
  }
};

export const download80GCertificate = async (req: Request, res: Response) => {
  try {
    const transaction = await DonationTransaction.findById(req.params.transactionId).populate("donorId");
    if (!transaction || transaction.status !== "success" || !transaction.taxExemption) {
      return res.status(404).json({ error: "80G certificate not available" });
    }

    const donor: any = transaction.donorId;
    res.status(200).json({
      success: true,
      message: "80G certificate data fetched successfully",
      data: {
        organization: "Islah Welfare Foundation",
        documentType: "80g_certificate",
        transactionId: transaction._id,
        receiptNo: transaction.receiptNo,
        donorName: donor.fullName,
        donorEmail: donor.email,
        pan: transaction.formSnapshot.pan || donor.pan || null,
        amount: transaction.amount,
        financialType: transaction.financialType,
        donationDate: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("Error generating 80G certificate:", error);
    res.status(500).json({ error: "Server error generating 80G certificate" });
  }
};
