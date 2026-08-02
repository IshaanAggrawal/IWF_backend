import { Request, Response } from "express";
import { NewsArticle } from "@shared/models/CmsContent";

export const getNews = async (req: Request, res: Response) => {
  try {
    const news = await NewsArticle.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: news });
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ error: "Server error fetching news" });
  }
};

export const createNews = async (req: Request, res: Response) => {
  try {
    const { tag, tagColor, date, title, excerpt, image, featured, readTime, published, sortOrder } = req.body;
    const newArticle = await NewsArticle.create({
      tag,
      tagColor,
      date: date || new Date().toISOString(),
      title,
      excerpt,
      image,
      featured: featured || false,
      readTime,
      published: published !== undefined ? published : true,
      sortOrder: sortOrder || 0
    });
    res.status(201).json({ success: true, data: newArticle });
  } catch (error) {
    console.error("Error creating news:", error);
    res.status(500).json({ error: "Server error creating news" });
  }
};
