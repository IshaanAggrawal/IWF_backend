import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { sendReceiptEmail } from "../../../communication/src/services/emailService";
import { DonationTransaction } from "../../../../shared/models/DonationTransaction";
import { Donor } from "../../../../shared/models/Donor";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_fallback",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "fallback_secret",
});

export const initializeDonation = async (req: Request, res: Response) => {
  try {
    const { amount, donorType, citizenship, fullName, email, phone, address, financialType, taxExemption, pan, consent } = req.body;
    
    // 1. Find or create donor (Update donor if they already exist based on email)
    let donor = await Donor.findOne({ email });
    if (!donor) {
      donor = await Donor.create({
        donorType,
        citizenship,
        fullName,
        email,
        phone,
        address,
        pan: taxExemption ? pan : undefined,
      });
    } else if (taxExemption && pan && !donor.pan) {
      // Update PAN if they request tax exemption this time
      donor.pan = pan;
      await donor.save();
    }

    // 2. Create pending DonationTransaction
    const transaction = await DonationTransaction.create({
      donorId: donor._id,
      amount,
      financialType,
      paymentMode: "online",
      status: "pending",
    });

    // 3. Call Razorpay API to generate order_id
    // Razorpay expects amount in smallest unit (paise for INR)
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: transaction._id.toString(),
      payment_capture: 1, // Auto-capture
    };

    const order = await razorpay.orders.create(options);

    // Update transaction with Razorpay order ID
    transaction.razorpayOrderId = order.id;
    await transaction.save();

    // 4. Return order_id and transaction ID to frontend
    res.status(200).json({ 
      success: true, 
      orderId: order.id, 
      transactionId: transaction._id,
      amount: order.amount 
    });
  } catch (error) {
    console.error("Error initializing donation:", error);
    res.status(500).json({ error: "Server error initializing donation" });
  }
};

export const verifyDonation = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = req.body;
    
    // 1. Verify signature using crypto
    const secret = process.env.RAZORPAY_KEY_SECRET || "fallback_secret";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // 2. Mark DonationTransaction as success
    const transaction = await DonationTransaction.findById(transactionId).populate("donorId");
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    transaction.status = "success";
    transaction.razorpayPaymentId = razorpay_payment_id;
    
    // Auto-generate a sequential receipt number (e.g., IWF-2026-XXXX)
    const count = await DonationTransaction.countDocuments({ status: "success" });
    transaction.receiptNo = `IWF-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;
    
    await transaction.save();

    // Update Donor's total donated amount and tier
    const donor = await Donor.findById(transaction.donorId);
    if (donor) {
      donor.totalDonated += transaction.amount;
      // Simple tier logic: >50000 Platinum, >10000 Gold, >1000 Silver
      if (donor.totalDonated >= 50000) donor.tier = "Platinum";
      else if (donor.totalDonated >= 10000) donor.tier = "Gold";
      else if (donor.totalDonated >= 1000) donor.tier = "Silver";
      await donor.save();
    }
    
    // Send Receipt Email asynchronously
    if (donor) {
      sendReceiptEmail(donor.email, transaction.receiptNo, transaction.amount).catch(console.error);
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Payment verified successfully",
      receiptNo: transaction.receiptNo
    });
  } catch (error) {
    console.error("Error verifying donation:", error);
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
