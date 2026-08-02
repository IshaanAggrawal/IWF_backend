import { Request, Response } from "express";
import { Model } from "mongoose";
import {
  ContentEntry,
  FinancialType,
  GalleryItem,
  HeroSlide,
  MembershipCategory,
  Person,
  ProgramPage,
} from "@shared/models/CmsContent";
import { asyncHandler } from "@shared/utils/asyncHandler";
import { AppError } from "@shared/utils/AppError";

const contentTypeByResource: Record<string, string> = {
  events: "event",
  causes: "cause",
  publications: "publication",
  "press-releases": "press-release",
  newsletters: "newsletter",
};

const modelByResource: Record<string, Model<any>> = {
  gallery: GalleryItem,
  "hero-slides": HeroSlide,
  people: Person,
  programs: ProgramPage,
  "financial-types": FinancialType,
  "membership-categories": MembershipCategory,
  events: ContentEntry,
  causes: ContentEntry,
  publications: ContentEntry,
  "press-releases": ContentEntry,
  newsletters: ContentEntry,
};

const getResourceConfig = (resource: string) => {
  const model = modelByResource[resource];
  if (!model) throw new AppError("CMS resource not found", 404);
  return { model, contentType: contentTypeByResource[resource] };
};

const firstParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value || "");

export const listCmsResource = asyncHandler(async (req: Request, res: Response) => {
  const { model, contentType } = getResourceConfig(firstParam(req.params.resource));
  const includeUnpublished = req.query.includeUnpublished === "true";
  const filter: Record<string, unknown> = {};
  if (contentType) filter.type = contentType;
  if (!includeUnpublished) filter.published = true;

  const data = await model.find(filter).sort({ sortOrder: 1, createdAt: -1 });
  res.json({ success: true, data });
});

export const getCmsResourceItem = asyncHandler(async (req: Request, res: Response) => {
  const { model, contentType } = getResourceConfig(firstParam(req.params.resource));
  const idOrSlug = firstParam(req.params.idOrSlug);
  const filter: Record<string, unknown> = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: idOrSlug }
    : { slug: idOrSlug };
  if (contentType) filter.type = contentType;

  const data = await model.findOne(filter);
  if (!data) throw new AppError("CMS item not found", 404);
  res.json({ success: true, data });
});

export const createCmsResourceItem = asyncHandler(async (req: Request, res: Response) => {
  const { model, contentType } = getResourceConfig(firstParam(req.params.resource));
  const payload = contentType ? { ...req.body, type: contentType } : req.body;
  const data = await model.create(payload);
  res.status(201).json({ success: true, data });
});

export const updateCmsResourceItem = asyncHandler(async (req: Request, res: Response) => {
  const { model, contentType } = getResourceConfig(firstParam(req.params.resource));
  const filter: Record<string, unknown> = { _id: req.params.id };
  if (contentType) filter.type = contentType;

  const data = await model.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });
  if (!data) throw new AppError("CMS item not found", 404);
  res.json({ success: true, data });
});

export const deleteCmsResourceItem = asyncHandler(async (req: Request, res: Response) => {
  const { model, contentType } = getResourceConfig(firstParam(req.params.resource));
  const filter: Record<string, unknown> = { _id: req.params.id };
  if (contentType) filter.type = contentType;

  const data = await model.findOneAndDelete(filter);
  if (!data) throw new AppError("CMS item not found", 404);
  res.json({ success: true });
});
