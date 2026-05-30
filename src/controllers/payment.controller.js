import { razorpayInstance } from '../config/razorpay.js';
import crypto from 'crypto';

// 1. Create Order
export const createOrder = async (req, res) => {
    try {
        const { amount, currency, receipt, notes } = req.body;
        
        const options = {
            amount: amount * 100, // Amount is in currency subunits (e.g., paisa for INR)
            currency: currency || "INR",
            receipt: receipt || `receipt_${Date.now()}`,
            notes: notes || {}
        };
        
        const order = await razorpayInstance.orders.create(options);
        
        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create order",
            error: error.message
        });
    }
};

// 2. Verify Payment Signature
export const verifyPayment = (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        
        const secret = process.env.RAZORPAY_KEY_SECRET;

        // Generate signature to compare
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            // Payment is successful
            res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                payment_id: razorpay_payment_id,
                order_id: razorpay_order_id
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Payment verification failed: Invalid signature"
            });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({
            success: false,
            message: "Failed to verify payment",
            error: error.message
        });
    }
};
