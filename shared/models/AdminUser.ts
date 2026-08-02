import mongoose, { Schema, Document } from "mongoose";

export interface IAdminUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: "admin" | "coordinator" | "member" | "user";
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "coordinator", "member", "user"], default: "admin" },
  },
  { timestamps: true }
);

export const AdminUser = mongoose.model<IAdminUser>("AdminUser", AdminUserSchema);
