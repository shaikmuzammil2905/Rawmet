import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { isS3Configured, uploadToS3 } from "@/lib/s3";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".pdf"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File size exceeds 5 MB limit." }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase() || ".png";
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json(
        { error: "Only PNG, JPG, WEBP, and PDF files are permitted." },
        { status: 400 }
      );
    }

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mime = MIME_BY_EXT[ext] || "application/octet-stream";

    // 1. If AWS S3 credentials are configured, upload to S3 bucket
    if (isS3Configured()) {
      try {
        const s3Url = await uploadToS3(buffer, filename, mime);
        return NextResponse.json({ url: s3Url, filename, storage: "s3" });
      } catch (s3Err) {
        console.error("AWS S3 upload error, falling back:", s3Err);
      }
    }

    // 2. On serverless/read-only filesystems (e.g. Vercel), return an inline data URL safely
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return NextResponse.json({
        url: `data:${mime};base64,${buffer.toString("base64")}`,
        filename,
      });
    }

    // 3. Local disk fallback
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      return NextResponse.json({ url: `/uploads/${filename}`, filename, storage: "local" });
    } catch {
      return NextResponse.json({
        url: `data:${mime};base64,${buffer.toString("base64")}`,
        filename,
      });
    }
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
