import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import {
  ImpactStat,
  Notice,
  NewsArticle,
  GalleryItem,
  HeroSlide,
  Person,
  ProgramPage,
  FinancialType,
  MembershipCategory,
} from "../../../shared/models/CmsContent";
import { SiteSettings } from "../../../shared/models/SiteSettings";
import { PatientCampaign } from "../../../shared/models/PatientCampaign";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { AppError } from "../../../shared/utils/AppError";
import { requireAuth } from "../../../shared/middlewares/auth";
import { DonorTierConfig } from "../../../shared/models/DonorTierConfig";
import { uploadBuffer } from "../../../infrastructure/storage/cloudinary";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

function crudRoutes<T>(
  path: string,
  Model: { find: Function; findById: Function; findByIdAndUpdate: Function; findByIdAndDelete: Function; create: Function },
  options: { publicFilter?: object; sort?: string } = {}
) {
  const sort = options.sort || "sortOrder";
  const publicFilter = options.publicFilter ?? { published: true };

  router.get(
    `/${path}`,
    asyncHandler(async (req, res) => {
      const admin = Boolean(req.headers.authorization);
      const filter = admin && req.query.all === "1" ? {} : publicFilter;
      const items = await Model.find(filter).sort(sort);
      res.json({ status: "success", items });
    })
  );

  router.get(
    `/${path}/:id`,
    asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw new AppError("Not found", 404);
      res.json({ status: "success", item });
    })
  );

  router.post(
    `/${path}`,
    requireAuth,
    asyncHandler(async (req, res) => {
      const item = await Model.create(req.body);
      res.status(201).json({ status: "success", item });
    })
  );

  router.patch(
    `/${path}/:id`,
    requireAuth,
    asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!item) throw new AppError("Not found", 404);
      res.json({ status: "success", item });
    })
  );

  router.delete(
    `/${path}/:id`,
    requireAuth,
    asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) throw new AppError("Not found", 404);
      res.json({ status: "success", message: "Deleted" });
    })
  );
}

router.get(
  "/settings",
  asyncHandler(async (_req, res) => {
    const settings = await SiteSettings.findOne().sort({ createdAt: -1 });
    res.json({ status: "success", settings });
  })
);

/** Donor recognition cards (Silver / Gold / Platinum) — separate from membership Blue/Yellow/Green */
router.get(
  "/donor-tiers",
  asyncHandler(async (_req, res) => {
    let config = await DonorTierConfig.findOne({ key: "default" });
    if (!config) {
      config = await DonorTierConfig.create({
        key: "default",
        tiers: [
          { name: "Silver", minAmount: 1, color: "#6B7280", label: "Silver Donor" },
          { name: "Gold", minAmount: 10000, color: "#D97706", label: "Gold Donor" },
          { name: "Platinum", minAmount: 50000, color: "#8B5CF6", label: "Platinum Donor" },
        ],
      });
    }
    res.json({ status: "success", config });
  })
);

router.put(
  "/donor-tiers",
  requireAuth,
  asyncHandler(async (req, res) => {
    let config = await DonorTierConfig.findOne({ key: "default" });
    if (!config) {
      config = await DonorTierConfig.create({ key: "default", tiers: req.body.tiers });
    } else {
      if (req.body.tiers) config.tiers = req.body.tiers;
      await config.save();
    }
    res.json({ status: "success", config });
  })
);

router.put(
  "/settings",
  requireAuth,
  asyncHandler(async (req, res) => {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json({ status: "success", settings });
  })
);

crudRoutes("stats", ImpactStat);
crudRoutes("notices", Notice);
crudRoutes("news", NewsArticle, { sort: "-createdAt" });
crudRoutes("gallery", GalleryItem);
crudRoutes("heroes", HeroSlide);
crudRoutes("people", Person);
crudRoutes("financial-types", FinancialType);
crudRoutes("membership-categories", MembershipCategory);

router.get(
  "/programs",
  asyncHandler(async (_req, res) => {
    const items = await ProgramPage.find({ published: true }).sort("slug");
    res.json({ status: "success", items });
  })
);

router.get(
  "/programs/:slug",
  asyncHandler(async (req, res) => {
    const item = await ProgramPage.findOne({ slug: req.params.slug, published: true });
    if (!item) throw new AppError("Program not found", 404);
    res.json({ status: "success", item });
  })
);

router.post(
  "/programs",
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await ProgramPage.create(req.body);
    res.status(201).json({ status: "success", item });
  })
);

router.patch(
  "/programs/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await ProgramPage.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw new AppError("Not found", 404);
    res.json({ status: "success", item });
  })
);

router.get(
  "/patients",
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = { published: true };
    if (req.query.urgent === "1") filter.urgent = true;
    const items = await PatientCampaign.find(filter).sort("-createdAt");
    res.json({ status: "success", items });
  })
);

router.get(
  "/patients/:slug",
  asyncHandler(async (req, res) => {
    const item = await PatientCampaign.findOne({
      $or: [{ slug: req.params.slug }, { verificationId: req.params.slug }],
      published: true,
    });
    if (!item) throw new AppError("Patient not found", 404);
    res.json({ status: "success", item });
  })
);

router.post(
  "/patients",
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await PatientCampaign.create(req.body);
    res.status(201).json({ status: "success", item });
  })
);

router.patch(
  "/patients/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await PatientCampaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw new AppError("Not found", 404);
    res.json({ status: "success", item });
  })
);

router.delete(
  "/patients/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const item = await PatientCampaign.findByIdAndDelete(req.params.id);
    if (!item) throw new AppError("Not found", 404);
    res.json({ status: "success", message: "Deleted" });
  })
);

router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError("file is required", 400);
    const folder = typeof req.body.folder === "string" ? req.body.folder : "cms";
    const result = await uploadBuffer(req.file.buffer, req.file.originalname, folder, req.file.mimetype);
    res.status(201).json({ status: "success", ...result });
  })
);

export default router;
