import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashOtp, hashPassword, maskEmail } from "@/lib/auth";
import { sendVerificationOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    ensureSeeded();
    const body = (await req.json()) as { email?: string; name?: string };

    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Please enter your email address." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address (e.g. name@company.com)." },
        { status: 400 }
      );
    }

    const db = getDb();
    let user = db
      .prepare(`SELECT id, email, role, status, otp_last_sent_at FROM users WHERE LOWER(email) = ?`)
      .get(email) as
      | { id: number; email: string; role: string; status: string; otp_last_sent_at?: string }
      | undefined;

    if (user && user.role === "admin") {
      return NextResponse.json(
        { error: "Admin accounts must sign in through the dedicated Admin Login portal." },
        { status: 403 }
      );
    }

    if (user && user.status === "suspended") {
      return NextResponse.json(
        { error: "Your account is currently suspended. Please contact customer support." },
        { status: 403 }
      );
    }

    // Rate Limiting / 60-Second Resend Cooldown
    if (user?.otp_last_sent_at) {
      const lastSentMs = new Date(user.otp_last_sent_at).getTime();
      const elapsedSeconds = Math.floor((Date.now() - lastSentMs) / 1000);
      if (elapsedSeconds < 60) {
        const remaining = 60 - elapsedSeconds;
        return NextResponse.json(
          { error: `Please wait ${remaining}s before requesting a new verification code.` },
          { status: 429 }
        );
      }
    }

    // Auto-create user record if not found
    if (!user) {
      const fallbackMobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
      const displayName =
        (body.name || "").trim() ||
        email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

      const randomPass = crypto.randomBytes(16).toString("hex");
      const ins = db
        .prepare(
          `INSERT INTO users (name, email, mobile, whatsapp, password_hash, role, status)
           VALUES (?, ?, ?, ?, ?, 'customer', 'active')`
        )
        .run(displayName, email, fallbackMobile, `91${fallbackMobile}`, hashPassword(randomPass));

      user = { id: Number(ins.lastInsertRowid), email, role: "customer", status: "active" };
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = String(crypto.randomInt(100000, 999999));
    const otpHashed = hashOtp(otp);
    // 5-minute expiration per specification
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    db.prepare(
      `UPDATE users 
       SET otp_code = ?, 
           otp_expires_at = ?, 
           otp_attempts = 0, 
           otp_last_sent_at = datetime('now') 
       WHERE id = ?`
    ).run(otpHashed, expiresAt, user.id);

    await syncDbToS3();

    // Send real SMTP email via Nodemailer
    const emailRes = await sendVerificationOtpEmail(email, otp);

    if (!emailRes.success) {
      console.error("sendVerificationOtpEmail failed for", email, ":", emailRes.error);
      return NextResponse.json(
        {
          error:
            "Unable to send verification email at this moment. Please check your email address or try again shortly.",
        },
        { status: 500 }
      );
    }

    // Successful real email dispatch - NEVER return the OTP itself to client
    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully to your email. Please check your inbox.",
      maskedEmail: maskEmail(email),
      email,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to process verification code.";
    console.error("request-otp error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
