import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    ensureSeeded();
    const body = (await req.json()) as { email?: string };
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid registered email address." },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = db
      .prepare(`SELECT id, email, status FROM users WHERE LOWER(email) = ? LIMIT 1`)
      .get(email) as { id: number; email: string; status: string } | undefined;

    // Safe response: Do not leak whether an email exists or not
    const safeResponse = {
      success: true,
      message:
        "If an account exists with this email address, a password reset link has been sent. Please check your inbox and spam folder.",
    };

    if (!user || user.status === "suspended") {
      return NextResponse.json(safeResponse);
    }

    // Generate cryptographically secure random token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    // 30-minute expiration per specification
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    db.prepare(`UPDATE users SET reset_token_hash = ?, reset_token_expires_at = ? WHERE id = ?`).run(
      tokenHash,
      expiresAt,
      user.id
    );

    await syncDbToS3();

    // Determine public site URL for reset link
    const hostHeader = req.headers.get("host") || "localhost:3000";
    const protoHeader = req.headers.get("x-forwarded-proto") || (hostHeader.includes("localhost") ? "http" : "https");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protoHeader}://${hostHeader}`;
    const resetLink = `${siteUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

    const emailRes = await sendPasswordResetEmail(user.email, resetLink);
    if (!emailRes.success) {
      console.error("sendPasswordResetEmail failed for", user.email, ":", emailRes.error);
    }

    return NextResponse.json(safeResponse);
  } catch (err) {
    console.error("forgot-password error:", err);
    return NextResponse.json(
      { error: "Unable to process password reset request. Please try again shortly." },
      { status: 500 }
    );
  }
}
