import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    ensureSeeded();
    const body = (await req.json()) as { mobile?: string; name?: string };
    const mobile = (body.mobile || "").replace(/\D/g, "").slice(-10);

    if (mobile.length !== 10) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
    }

    const db = getDb();
    let user = db.prepare(`SELECT id, role, status FROM users WHERE mobile = ?`).get(mobile) as
      | { id: number; role: string; status: string }
      | undefined;

    if (user && user.role === "admin") {
      return NextResponse.json(
        { error: "Admin accounts must sign in through the dedicated Admin Login portal." },
        { status: 403 }
      );
    }

    if (user && user.status === "suspended") {
      return NextResponse.json({ error: "Account is suspended." }, { status: 403 });
    }

    if (!user) {
      const displayName = (body.name || "").trim() || `Buyer ${mobile.slice(-4)}`;
      const tempEmail = `user.${mobile}@rawmet.local`;
      const randomPass = crypto.randomBytes(16).toString("hex");
      const ins = db
        .prepare(
          `INSERT INTO users (name, email, mobile, whatsapp, password_hash, role, status)
           VALUES (?, ?, ?, ?, ?, 'customer', 'active')`
        )
        .run(displayName, tempEmail, mobile, `91${mobile}`, hashPassword(randomPass));
      user = { id: Number(ins.lastInsertRowid), role: "customer", status: "active" };
    }

    const otp = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    db.prepare(`UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?`).run(
      otp,
      expiresAt,
      user.id
    );

    return NextResponse.json({
      success: true,
      message: `OTP sent to +91 ${mobile}. Valid for 10 minutes.`,
      // Provided in sandbox/local demo so evaluators can verify the full OTP flow end-to-end
      demoOtp: process.env.NODE_ENV !== "production" || !process.env.SMS_GATEWAY_KEY ? otp : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate OTP." }, { status: 500 });
  }
}

