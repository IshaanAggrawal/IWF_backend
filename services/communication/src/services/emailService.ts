import nodemailer from "nodemailer";

// Using a test account or environment variables for production
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "test_user",
    pass: process.env.SMTP_PASS || "test_pass",
  },
});

export const sendReceiptEmail = async (to: string, receiptNo: string, amount: number) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Islah Welfare Foundation" <no-reply@iwfindia.org>',
      to,
      subject: `Your Donation Receipt - ${receiptNo}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #15582f;">Thank you for your generous donation!</h2>
          <p>Dear Donor,</p>
          <p>We have successfully received your donation of <strong>Rs. ${amount.toLocaleString("en-IN")}</strong>.</p>
          <p>Your official receipt number is: <strong>${receiptNo}</strong></p>
          <p>You can download your 80G Tax Exemption receipt directly from our website using your receipt number or email address.</p>
          <br/>
          <p>With gratitude,<br/>The IWF Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Receipt email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending receipt email:", error);
    return false;
  }
};
