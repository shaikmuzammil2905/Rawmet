import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

const ipResetHits = new Map<string, { count: number; resetAt: number }>();

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipResetHits.get(ip);
  if (!entry || entry.resetAt < now) {
    ipResetHits.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 15) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: Request) {
  try {
    ensureSeeded();
    const clientIp = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    if (!checkIpRateLimit(clientIp)) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

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
      .prepare(`SELECT id, email, status, reset_requested_at FROM users WHERE LOWER(email) = ? LIMIT 1`)
      .get(email) as { id: number; email: string; status: string; reset_requested_at?: string } | undefined;

    // Safe response: Do not leak whether an email exists or not
    const safeResponse = {
      success: true,
      message:
        "If an account exists with this email address, a password reset link has been sent. Please check your inbox and spam folder.",
    };

    if (!user || user.status === "suspended") {
      return NextResponse.json(safeResponse);
    }

    // 60-second per-email cooldown
    if (user.reset_requested_at) {
      const lastReq = new Date(user.reset_requested_at).getTime();
      if (!Number.isNaN(lastReq) && Date.now() - lastReq < 60 * 1000) {
        return NextResponse.json(
          { error: "Please wait 60 seconds before requesting another password reset link." },
          { status: 429 }
        );
      }
    }

    // Generate cryptographically secure random token (64 hex characters)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    // 30-minute expiration per specification
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    db.prepare(
      `UPDATE users SET reset_token_hash = ?, reset_token_expires_at = ?, reset_requested_at = ? WHERE id = ?`
    ).run(tokenHash, expiresAt, nowIso, user.id);

    await syncDbToS3();

    // Determine public site URL for reset link
    const hostHeader = req.headers.get("host") || "localhost:3000";
    const protoHeader = req.headers.get("x-forwarded-proto") || (hostHeader.includes("localhost") ? "http" : "https");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protoHeader}://${hostHeader}`;
    const resetLink = `${siteUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;

    const emailRes = await sendPasswordResetEmail(user.email, resetLink);
    if (!emailRes.success) {
      console.error("sendPasswordResetEmail failed for", user.email, ":", emailRes.error);
      return NextResponse.json(
        { error: "Unable to send password reset email at this moment. Please try again shortly." },
        { status: 500 }
      );
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
