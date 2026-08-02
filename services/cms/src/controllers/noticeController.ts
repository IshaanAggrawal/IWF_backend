import { Request, Response } from "express";
import { Notice } from "@shared/models/CmsContent";

export const getNotices = async (req: Request, res: Response) => {
  try {
    const notices = await Notice.find({ published: true }).sort({ sortOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, data: notices });
  } catch (error) {
    res.status(500).json({ error: "Server error fetching notices" });
  }
};

export const createNotice = async (req: Request, res: Response) => {
  try {
    const { text, href, type, day, month, title, sortOrder, published, startsAt, endsAt } = req.body;
    
    const newNotice = await Notice.create({
      text,
      href,
      type: type || "ticker",
      day,
      month,
      title,
      sortOrder: sortOrder || 0,
      published: published !== undefined ? published : true,
      startsAt,
      endsAt,
    });

    res.status(201).json({ success: true, data: newNotice });
  } catch (error) {
    console.error("Error creating notice:", error);
    res.status(500).json({ error: "Server error creating notice" });
  }
};
