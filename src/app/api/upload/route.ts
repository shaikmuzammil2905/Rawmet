import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".pdf"]);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    const bytes = await file.arrayBuffer();
    fs.writeFileSync(path.join(uploadDir, filename), Buffer.from(bytes));

    return NextResponse.json({ url: `/uploads/${filename}`, filename });
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}

