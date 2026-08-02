import Razorpay from "razorpay";
import crypto from "crypto";
import { DonationTransaction } from "@shared/models/DonationTransaction";
import { Donor } from "@shared/models/Donor";
import { sendReceiptEmail } from "@services/communication/src/services/emailService";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_fallback",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "fallback_secret",
});

export const processDonationInitialization = async (data: any) => {
  const { amount, donorType, citizenship, fullName, email, phone, address, financialType, taxExemption, pan } = data;

  let donor = await Donor.findOne({ email });
  if (!donor) {
    donor = await Donor.create({
      donorType, citizenship, fullName, email, phone, address,
      pan: taxExemption ? pan : undefined,
    });
  } else if (taxExemption && pan && !donor.pan) {
    donor.pan = pan;
    await donor.save();
  }

  const transaction = await DonationTransaction.create({
    donorId: donor._id,
    amount,
    financialType,
    paymentMode: "online",
    status: "pending",
  });

  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: transaction._id.toString(),
    payment_capture: 1,
  };

  const order = await razorpay.orders.create(options);
  transaction.razorpayOrderId = order.id;
  await transaction.save();

  return { orderId: order.id, transactionId: transaction._id, amount: order.amount };
};

export const verifyAndCompleteDonation = async (data: any) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId } = data;

  const secret = process.env.RAZORPAY_KEY_SECRET || "fallback_secret";
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new Error("Invalid payment signature");
  }

  const transaction = await DonationTransaction.findById(transactionId).populate("donorId");
  if (!transaction) throw new Error("Transaction not found");

  transaction.status = "success";
  transaction.razorpayPaymentId = razorpay_payment_id;
  
  const count = await DonationTransaction.countDocuments({ status: "success" });
  transaction.receiptNo = `IWF-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, "0")}`;
  await transaction.save();

  const donor = await Donor.findById(transaction.donorId);
  if (donor) {
    donor.totalDonated += transaction.amount;
    if (donor.totalDonated >= 50000) donor.tier = "Platinum";
    else if (donor.totalDonated >= 10000) donor.tier = "Gold";
    else if (donor.totalDonated >= 1000) donor.tier = "Silver";
    await donor.save();
    sendReceiptEmail(donor.email, transaction.receiptNo, transaction.amount).catch(console.error);
  }

  return { receiptNo: transaction.receiptNo };
};
