import { Request, Response } from "express";
import { ContactMessage } from "../../../../shared/models/Communication";
import { Subscriber } from "../../../../shared/models/Subscriber";

export const submitContactForm = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;

    if (!firstName || !lastName || !email || !phone || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newMessage = await ContactMessage.create({
      firstName,
      lastName,
      email,
      phone,
      subject: subject || "General Inquiry",
      message,
    });

    // TODO: Trigger Email via Resend/AWS SES to Admin Team here

    res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({ error: "Server error submitting contact form" });
  }
};

export const subscribeNewsletter = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Using updateOne with upsert to activate if previously deactivated
    await Subscriber.updateOne(
      { email },
      { $set: { isActive: true } },
      { upsert: true }
    );

    res.status(200).json({ success: true, message: "Successfully subscribed to the newsletter!" });
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    res.status(500).json({ error: "Server error processing subscription" });
  }
};
