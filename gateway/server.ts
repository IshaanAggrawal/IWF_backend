import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import mongoose from "mongoose";
import { connectDB } from "@shared/config/db";
import { validateEnvironment } from "@shared/config/env";
import { errorHandler } from "@shared/middlewares/errorHandler";
import authRoutes from "@services/auth/src/routes";
import paymentRoutes from "@services/payment/src/routes";
import membershipRoutes from "@services/membership/src/routes";
import communicationRoutes from "@services/communication/src/routes";
import cmsRoutes from "@services/cms/src/routes";
import panelRoutes from "@services/panels/src/routes";
import { startMembershipLifecycleAutomation } from "@services/membership/src/services/membershipAutomation";
import { openApiDocument } from "./openApi";

dotenv.config();
const envStatus = validateEnvironment();

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// Production Logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    message: "API Gateway is running!",
    dependencies: {
      database: mongoose.connection.readyState === 1 ? "connected" : "not-connected",
      email: process.env.SMTP_HOST ? "configured" : "fallback-or-unconfigured",
      payment: process.env.RAZORPAY_KEY_ID ? "configured" : "fallback-or-unconfigured",
    },
    environment: {
      missingRecommended: envStatus.missing,
    },
    razorpayMode: (process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_")
      ? "test"
      : process.env.RAZORPAY_KEY_ID?.includes("YOUR_")
        ? "unconfigured"
        : "live-or-unknown",
  });
});

app.get("/api/docs", (_req, res) => {
  res.status(200).json(openApiDocument);
});

app.use("/api/auth", authRoutes);
app.use("/api/donations", paymentRoutes);
app.use("/api/membership", membershipRoutes);
app.use("/api/contact", communicationRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/panels", panelRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Gateway running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
  startMembershipLifecycleAutomation();
});
