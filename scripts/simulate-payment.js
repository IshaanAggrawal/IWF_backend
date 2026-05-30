import crypto from 'crypto';
import 'dotenv/config';

// Ensure you run this while your server is running (npm run dev)
const SERVER_URL = 'http://localhost:3000/api/payment';
const SECRET = process.env.RAZORPAY_KEY_SECRET;

async function simulatePaymentFlow() {
    console.log("🚀 Starting Razorpay Payment Simulation...\n");

    try {
        // STEP 1: Call Backend to Create Order (What your frontend will do first)
        console.log("1️⃣ Requesting Order ID from Backend...");
        const orderResponse = await fetch(`${SERVER_URL}/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 500, currency: "INR" }) // ₹500
        });
        const orderData = await orderResponse.json();
        
        if (!orderData.success) {
            throw new Error("Failed to create order: " + JSON.stringify(orderData));
        }
        
        const orderId = orderData.order.id;
        console.log(`✅ Order Created Successfully! Order ID: ${orderId}\n`);

        // STEP 2: Simulate Razorpay Checkout (What happens on Razorpay's servers)
        console.log("2️⃣ Simulating Razorpay processing the payment...");
        const mockPaymentId = `pay_test_${crypto.randomBytes(6).toString('hex')}`;
        
        // Generating the valid signature the exact same way Razorpay does it internally
        const generatedSignature = crypto
            .createHmac('sha256', SECRET)
            .update(orderId + "|" + mockPaymentId)
            .digest('hex');

        console.log(`✅ Payment 'Successful'!`);
        console.log(`   Mock Payment ID: ${mockPaymentId}`);
        console.log(`   Generated Signature: ${generatedSignature}\n`);

        // STEP 3: Call Backend to Verify Payment (What your frontend will do after success)
        console.log("3️⃣ Sending data back to Backend for Verification...");
        const verifyResponse = await fetch(`${SERVER_URL}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                razorpay_order_id: orderId,
                razorpay_payment_id: mockPaymentId,
                razorpay_signature: generatedSignature
            })
        });
        const verifyData = await verifyResponse.json();

        if (verifyData.success) {
            console.log("🎉 Backend successfully verified the signature!");
            console.log("Backend Response:", verifyData);
        } else {
            console.error("❌ Backend verification failed!", verifyData);
        }

    } catch (error) {
        console.error("Simulation failed:", error.message);
    }
}

if (!SECRET) {
    console.error("❌ Please set RAZORPAY_KEY_SECRET in your .env file before running this simulation.");
} else {
    simulatePaymentFlow();
}
