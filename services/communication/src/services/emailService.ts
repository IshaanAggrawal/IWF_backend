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
      text: [
        "Thank you for your generous donation.",
        `Amount received: Rs. ${amount.toLocaleString("en-IN")}`,
        `Receipt number: ${receiptNo}`,
        "You can retrieve your receipt from the website using your receipt number or email address.",
        "With gratitude,",
        "The IWF Team",
      ].join("\n"),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Receipt email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending receipt email:", error);
    return false;
  }
};

export const sendMembershipOtpEmail = async (to: string, otp: string, purpose: string) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Islah Welfare Foundation" <no-reply@iwfindia.org>',
      to,
      subject: `Your IWF membership OTP`,
      text: [`Your IWF membership OTP for ${purpose} is ${otp}.`, "This OTP is valid for 10 minutes."].join("\n"),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Membership OTP email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending membership OTP:", error);
    return false;
  }
};

export const sendMembershipReminderEmail = async (to: string, name: string, validTill: string) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Islah Welfare Foundation" <no-reply@iwfindia.org>',
      to,
      subject: "IWF membership renewal reminder",
      text: [
        `Dear ${name},`,
        `Your IWF membership is valid till ${validTill}.`,
        "Please renew your membership to keep your benefits active.",
      ].join("\n"),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Membership reminder email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending membership reminder:", error);
    return false;
  }
};

export const sendContactFormNotification = async (contactDetails: any) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@iwfindia.org";
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Islah Welfare Foundation" <no-reply@iwfindia.org>',
      to: adminEmail,
      subject: `New Contact Form Submission: ${contactDetails.subject}`,
      text: [
        "New Contact Form Submission",
        `Name: ${contactDetails.firstName} ${contactDetails.lastName}`,
        `Email: ${contactDetails.email}`,
        `Phone: ${contactDetails.phone}`,
        `Subject: ${contactDetails.subject}`,
        "Message:",
        contactDetails.message,
      ].join("\n"),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Contact form notification sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending contact notification:", error);
    return false;
  }
};
