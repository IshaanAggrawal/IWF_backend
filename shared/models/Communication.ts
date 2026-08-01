import mongoose, { Schema, Document } from "mongoose";

export interface IContactMessage extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  zip?: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
    zip: String,
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "read", "replied"], default: "new" },
  },
  { timestamps: true }
);

export const ContactMessage = mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);

export interface IQuickMessage extends Document {
  name: string;
  email: string;
  message: string;
  status: "new" | "read";
  createdAt: Date;
  updatedAt: Date;
}

const QuickMessageSchema = new Schema<IQuickMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "read"], default: "new" },
  },
  { timestamps: true }
);

export const QuickMessage = mongoose.model<IQuickMessage>("QuickMessage", QuickMessageSchema);

export interface INewsletterSubscriber extends Document {
  email: string;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    source: String,
  },
  { timestamps: true }
);

export const NewsletterSubscriber = mongoose.model<INewsletterSubscriber>(
  "NewsletterSubscriber",
  NewsletterSubscriberSchema
);

export type RoleType = "volunteer" | "partner" | "sponsor" | "mentor" | "employee";

export interface IRoleApplication extends Document {
  role: RoleType;
  data: Record<string, unknown>;
  resumeUrl?: string;
  status: "new" | "reviewed" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const RoleApplicationSchema = new Schema<IRoleApplication>(
  {
    role: {
      type: String,
      enum: ["volunteer", "partner", "sponsor", "mentor", "employee"],
      required: true,
    },
    data: { type: Schema.Types.Mixed, required: true },
    resumeUrl: String,
    status: {
      type: String,
      enum: ["new", "reviewed", "accepted", "rejected"],
      default: "new",
    },
  },
  { timestamps: true }
);

export const RoleApplication = mongoose.model<IRoleApplication>("RoleApplication", RoleApplicationSchema);
