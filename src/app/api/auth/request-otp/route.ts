import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashPassword } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    ensureSeeded();
    const body = (await req.json()) as { email?: string; mobile?: string; name?: string };

    const rawEmail = (body.email || "").trim().toLowerCase();
    const rawMobile = (body.mobile || "").replace(/\D/g, "").slice(-10);

    // Prioritize Email OTP as requested
    let email = rawEmail;
    let mobile = rawMobile;

    if (!email && !mobile) {
      return NextResponse.json({ error: "Please enter your email address." }, { status: 400 });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address (e.g. name@company.com)." }, { status: 400 });
    }

    const db = getDb();
    let user: { id: number; email: string; role: string; status: string } | undefined;

    if (email) {
      user = db.prepare(`SELECT id, email, role, status FROM users WHERE LOWER(email) = ?`).get(email) as
        | { id: number; email: string; role: string; status: string }
        | undefined;
    } else if (mobile) {
      user = db.prepare(`SELECT id, email, role, status FROM users WHERE mobile = ?`).get(mobile) as
        | { id: number; email: string; role: string; status: string }
        | undefined;
      if (user) email = user.email;
    }

    if (user && user.role === "admin") {
      return NextResponse.json(
        { error: "Admin accounts must sign in through the dedicated Admin Login portal." },
        { status: 403 }
      );
    }

    if (user && user.status === "suspended") {
      return NextResponse.json({ error: "Your account is currently suspended. Please contact customer support." }, { status: 403 });
    }

    // Auto-create user if not found
    if (!user) {
      if (!email) {
        email = `user.${mobile}@rawmet.local`;
      }
      if (!mobile) {
        mobile = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
      }
      const displayName =
        (body.name || "").trim() ||
        email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

      const randomPass = crypto.randomBytes(16).toString("hex");
      const ins = db
        .prepare(
          `INSERT INTO users (name, email, mobile, whatsapp, password_hash, role, status)
           VALUES (?, ?, ?, ?, ?, 'customer', 'active')`
        )
        .run(displayName, email, mobile, `91${mobile}`, hashPassword(randomPass));

      user = { id: Number(ins.lastInsertRowid), email, role: "customer", status: "active" };
    }

    const otp = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(`UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?`).run(
      otp,
      expiresAt,
      user.id
    );

    await syncDbToS3();

    // Directly send OTP email
    let emailSent = false;
    if (email && email.includes("@") && !email.endsWith("@rawmet.local")) {
      const emailRes = await sendOtpEmail(email, otp, "customer_login");
      emailSent = emailRes.success;
      if (!emailRes.success) {
        console.warn("sendOtpEmail notice:", emailRes.error);
      }
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `OTP code sent directly to ${email}. Please check your inbox or spam folder.`
        : `OTP generated for ${email}. Valid for 10 minutes.`,
      email,
      emailSent,
      // Provide demoOtp in local / testing environments
      demoOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to generate OTP.";
    console.error("request-otp error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
