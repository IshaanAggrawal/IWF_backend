import { Request, Response } from "express";
import { ImpactStat } from "@shared/models/CmsContent";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const stats = await ImpactStat.find({ published: true }).sort({ sortOrder: 1 });
    res.status(200).json({ success: true, data: { impactStats: stats } });
  } catch (error) {
    res.status(500).json({ error: "Server error fetching settings" });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { impactStats } = req.body;
    
    // Simple bulk update for impact stats
    if (impactStats && Array.isArray(impactStats)) {
      for (const stat of impactStats) {
        await ImpactStat.findOneAndUpdate(
          { key: stat.key },
          { $set: stat },
          { upsert: true, new: true }
        );
      }
    }

    res.status(200).json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Server error updating settings" });
  }
};
