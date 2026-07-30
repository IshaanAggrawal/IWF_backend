import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import {
  ContactMessage,
  QuickMessage,
  NewsletterSubscriber,
  RoleApplication,
} from "../../../shared/models/Communication";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { AppError } from "../../../shared/utils/AppError";
import { uploadBuffer } from "../../../infrastructure/storage/cloudinary";
import { requireAuth } from "../../../shared/middlewares/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().min(10),
      address: z.string().optional(),
      zip: z.string().optional(),
      subject: z.string().min(2),
      message: z.string().min(10),
      privacy: z.literal(true).or(z.boolean().refine((v) => v === true)),
    });
    const data = schema.parse(req.body);
    const doc = await ContactMessage.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      zip: data.zip,
      subject: data.subject,
      message: data.message,
    });
    res.status(201).json({ status: "success", message: "Contact form submitted", id: doc.id });
  })
);

router.post(
  "/messages",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      message: z.string().min(1),
    });
    const data = schema.parse(req.body);
    const doc = await QuickMessage.create(data);
    res.status(201).json({ status: "success", id: doc.id });
  })
);

router.post(
  "/newsletter",
  asyncHandler(async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      source: z.string().optional(),
    });
    const data = schema.parse(req.body);
    const existing = await NewsletterSubscriber.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return res.json({ status: "success", message: "Already subscribed" });
    }
    await NewsletterSubscriber.create({
      email: data.email.toLowerCase(),
      source: data.source,
    });
    res.status(201).json({ status: "success", message: "Subscribed" });
  })
);

const ROLE_TYPES = ["volunteer", "partner", "sponsor", "mentor", "employee"] as const;

router.post(
  "/roles/:type",
  upload.single("resume"),
  asyncHandler(async (req, res) => {
    const type = req.params.type as (typeof ROLE_TYPES)[number];
    if (!ROLE_TYPES.includes(type)) throw new AppError("Invalid role type", 400);

    let payload: Record<string, unknown> = {};
    if (typeof req.body.data === "string") {
      payload = JSON.parse(req.body.data);
    } else if (req.body && typeof req.body === "object") {
      const { data: _d, ...rest } = req.body;
      payload = rest;
    }

    let resumeUrl: string | undefined;
    if (req.file) {
      const up = await uploadBuffer(req.file.buffer, req.file.originalname, "resumes", req.file.mimetype);
      resumeUrl = up.url;
    }

    if (type === "employee" && !resumeUrl && !payload.resumeUrl) {
      throw new AppError("Resume is required for employee applications", 400);
    }

    const doc = await RoleApplication.create({
      role: type,
      data: payload,
      resumeUrl,
    });

    res.status(201).json({ status: "success", application: { id: doc.id, role: doc.role } });
  })
);

router.get(
  "/inbox",
  requireAuth,
  asyncHandler(async (_req, res) => {
    const [contacts, messages, roles, newsletters] = await Promise.all([
      ContactMessage.find().sort({ createdAt: -1 }).limit(100),
      QuickMessage.find().sort({ createdAt: -1 }).limit(100),
      RoleApplication.find().sort({ createdAt: -1 }).limit(100),
      NewsletterSubscriber.find().sort({ createdAt: -1 }).limit(200),
    ]);
    res.json({ status: "success", contacts, messages, roles, newsletters });
  })
);

export default router;
