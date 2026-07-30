import mongoose, { Schema, Document } from "mongoose";

export interface IImpactStat extends Document {
  key: string;
  value: number;
  suffix: string;
  label: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  published: boolean;
}

const ImpactStatSchema = new Schema<IImpactStat>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true },
    suffix: { type: String, default: "+" },
    label: { type: String, required: true },
    icon: String,
    color: String,
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ImpactStat = mongoose.model<IImpactStat>("ImpactStat", ImpactStatSchema);

export interface INotice extends Document {
  text: string;
  href?: string;
  type: "ticker" | "event";
  day?: string;
  month?: string;
  title?: string;
  sortOrder: number;
  published: boolean;
  startsAt?: Date;
  endsAt?: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    text: { type: String, required: true },
    href: String,
    type: { type: String, enum: ["ticker", "event"], default: "ticker" },
    day: String,
    month: String,
    title: String,
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date,
  },
  { timestamps: true }
);

export const Notice = mongoose.model<INotice>("Notice", NoticeSchema);

export interface INewsArticle extends Document {
  tag: string;
  tagColor?: string;
  date: string;
  title: string;
  excerpt: string;
  image?: string;
  featured: boolean;
  readTime?: string;
  published: boolean;
  sortOrder: number;
}

const NewsArticleSchema = new Schema<INewsArticle>(
  {
    tag: { type: String, required: true },
    tagColor: String,
    date: { type: String, required: true },
    title: { type: String, required: true },
    excerpt: { type: String, required: true },
    image: String,
    featured: { type: Boolean, default: false },
    readTime: String,
    published: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const NewsArticle = mongoose.model<INewsArticle>("NewsArticle", NewsArticleSchema);

export interface IGalleryItem extends Document {
  title: string;
  image: string;
  type: "photo" | "video";
  sortOrder: number;
  published: boolean;
}

const GalleryItemSchema = new Schema<IGalleryItem>(
  {
    title: { type: String, required: true },
    image: { type: String, required: true },
    type: { type: String, enum: ["photo", "video"], default: "photo" },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const GalleryItem = mongoose.model<IGalleryItem>("GalleryItem", GalleryItemSchema);

export interface IHeroSlide extends Document {
  image: string;
  alt: string;
  ctaLabel?: string;
  ctaHref?: string;
  sortOrder: number;
  published: boolean;
}

const HeroSlideSchema = new Schema<IHeroSlide>(
  {
    image: { type: String, required: true },
    alt: { type: String, required: true },
    ctaLabel: String,
    ctaHref: String,
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const HeroSlide = mongoose.model<IHeroSlide>("HeroSlide", HeroSlideSchema);

export interface IPerson extends Document {
  name: string;
  designation: string;
  group: "board" | "executive" | "advisor" | "field" | "contact";
  qualification?: string;
  district?: string;
  state?: string;
  mobile?: string;
  email?: string;
  expertise?: string;
  bio?: string;
  image?: string;
  sortOrder: number;
  published: boolean;
}

const PersonSchema = new Schema<IPerson>(
  {
    name: { type: String, required: true },
    designation: { type: String, required: true },
    group: {
      type: String,
      enum: ["board", "executive", "advisor", "field", "contact"],
      required: true,
    },
    qualification: String,
    district: String,
    state: String,
    mobile: String,
    email: String,
    expertise: String,
    bio: String,
    image: String,
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Person = mongoose.model<IPerson>("Person", PersonSchema);

export interface IProgramPage extends Document {
  slug: string;
  kind: "sector" | "healthcare";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  quote?: string;
  heroImage?: string;
  sections: { key: string; title?: string; body?: string; items?: string[] }[];
  published: boolean;
}

const ProgramPageSchema = new Schema<IProgramPage>(
  {
    slug: { type: String, required: true, unique: true },
    kind: { type: String, enum: ["sector", "healthcare"], required: true },
    eyebrow: String,
    title: { type: String, required: true },
    subtitle: String,
    quote: String,
    heroImage: String,
    sections: [{ key: String, title: String, body: String, items: [String] }],
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ProgramPage = mongoose.model<IProgramPage>("ProgramPage", ProgramPageSchema);

export interface IFinancialType extends Document {
  name: string;
  sortOrder: number;
  published: boolean;
}

const FinancialTypeSchema = new Schema<IFinancialType>(
  {
    name: { type: String, required: true, unique: true },
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FinancialType = mongoose.model<IFinancialType>("FinancialType", FinancialTypeSchema);

export interface IMembershipCategory extends Document {
  name: "Blue" | "Yellow" | "Green";
  code: string;
  amount: number;
  features: string[];
  color?: string;
  sortOrder: number;
  published: boolean;
}

const MembershipCategorySchema = new Schema<IMembershipCategory>(
  {
    name: { type: String, enum: ["Blue", "Yellow", "Green"], required: true, unique: true },
    code: { type: String, required: true },
    amount: { type: Number, required: true },
    features: [String],
    color: String,
    sortOrder: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MembershipCategory = mongoose.model<IMembershipCategory>(
  "MembershipCategory",
  MembershipCategorySchema
);
