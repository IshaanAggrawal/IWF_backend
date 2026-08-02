import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";

function isCloudinaryConfigured(): boolean {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return Boolean(
    cloud &&
      key &&
      secret &&
      !cloud.startsWith("YOUR_") &&
      !key.startsWith("YOUR_") &&
      !secret.startsWith("YOUR_")
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type UploadResult = {
  url: string;
  key: string;
  storage: "cloudinary" | "local";
  publicId?: string;
};

/**
 * Upload a buffer to Cloudinary (public CDN).
 * Falls back to local /uploads when credentials are not set.
 */
export async function uploadBuffer(
  buffer: Buffer,
  originalName: string,
  folder = "uploads",
  contentType = "application/octet-stream"
): Promise<UploadResult> {
  const ext = path.extname(originalName) || "";
  const baseFolder = (process.env.CLOUDINARY_FOLDER || "iwf").replace(/\/$/, "");
  const key = `${baseFolder}/${folder}/${Date.now()}-${randomUUID()}${ext}`;

  if (isCloudinaryConfigured()) {
    configureCloudinary();
    const resourceType = contentType.startsWith("video/")
      ? "video"
      : contentType.startsWith("image/")
        ? "image"
        : "raw";

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${baseFolder}/${folder}`,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        },
        (err, uploaded) => {
          if (err || !uploaded) reject(err || new Error("Cloudinary upload failed"));
          else resolve({ secure_url: uploaded.secure_url, public_id: uploaded.public_id });
        }
      );
      stream.end(buffer);
    });

    return {
      url: result.secure_url,
      key: result.public_id,
      publicId: result.public_id,
      storage: "cloudinary",
    };
  }

  // Local fallback when Cloudinary is not configured
  const uploadsDir = path.join(process.cwd(), "uploads", folder);
  fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = path.basename(key);
  const localPath = path.join(uploadsDir, filename);
  fs.writeFileSync(localPath, buffer);
  const port = process.env.PORT || 5000;
  return {
    url: `http://localhost:${port}/uploads/${folder}/${filename}`,
    key,
    storage: "local",
  };
}
