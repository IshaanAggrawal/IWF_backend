import { Request, Response } from "express";
import { Member } from "../../../../shared/models/Member";

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

export const applyRole = async (req: Request, res: Response) => {
  try {
    const { roleType, fullName, email, phone, location } = req.body;
    
    // 1. Validate input
    // 2. Save role application to DB
    // 3. (Optional) Trigger email to admin
    
    res.status(201).json({ success: true, message: "Role application submitted successfully mock" });
  } catch (error) {
    console.error("Error applying for role:", error);
    res.status(500).json({ error: "Server error submitting application" });
  }
};
