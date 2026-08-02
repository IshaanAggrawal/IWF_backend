import { Request, Response } from "express";
import { Member } from "@shared/models/Member";
import { processMembershipApplication } from "../services/membershipService";
import { z } from "zod";

export const getMembers = async (req: Request, res: Response) => {
  try {
    // Only fetch approved members for public listing
    const members = await Member.find({ status: "Active" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ error: "Server error fetching members" });
  }
};



const applicationSchema = z.object({
  fullName: z.string().min(2),
  fatherName: z.string().optional(),
  mobile: z.string().min(10),
  email: z.string().email(),
  address: z.string(),
  state: z.string(),
  district: z.string(),
  pincode: z.string(),
  category: z.enum(["Blue", "Yellow", "Green"]),
  membershipPeriod: z.number().int().positive(),
  paymentMode: z.string(),
  amount: z.number().positive(),
  convenienceFee: z.number().optional(),
});

export const applyRole = async (req: Request, res: Response) => {
  try {
    const validatedData = applicationSchema.parse(req.body);
    
    const application = await processMembershipApplication(validatedData);
    
    res.status(201).json({ 
      success: true, 
      message: "Role application submitted successfully",
      data: application 
    });
  } catch (error) {
    console.error("Error applying for role:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid application data", details: (error as any).issues || (error as any).errors });
    }
    res.status(500).json({ error: "Server error submitting application" });
  }
};
