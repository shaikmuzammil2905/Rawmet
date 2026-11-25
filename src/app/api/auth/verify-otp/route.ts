import { NextResponse } from "next/server";
import { getDb, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { sanitizeUser, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    ensureSeeded();
    const body = (await req.json()) as { email?: string; mobile?: string; otp?: string };
    const email = (body.email || "").trim().toLowerCase();
    const mobile = (body.mobile || "").replace(/\D/g, "").slice(-10);
    const otp = (body.otp || "").trim();

    if (!email && !mobile) {
      return NextResponse.json({ error: "Email or mobile number is required." }, { status: 400 });
    }

    if (otp.length !== 6) {
      return NextResponse.json({ error: "Please enter the valid 6-digit OTP code." }, { status: 400 });
    }

    const db = getDb();
    let row: Record<string, unknown> | undefined;

    if (email) {
      row = db
        .prepare(`SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1`)
        .get(email) as Record<string, unknown> | undefined;
    } else if (mobile) {
      row = db
        .prepare(`SELECT * FROM users WHERE mobile = ? LIMIT 1`)
        .get(mobile) as Record<string, unknown> | undefined;
    }

    if (!row || String(row.otp_code) !== otp) {
      return NextResponse.json({ error: "Incorrect OTP code. Please check your email and try again." }, { status: 401 });
    }

    if (!row.otp_expires_at || new Date(String(row.otp_expires_at)).getTime() < Date.now()) {
      return NextResponse.json({ error: "OTP has expired. Please request a new verification code." }, { status: 401 });
    }

    db.prepare(`UPDATE users SET otp_code = '', otp_expires_at = '' WHERE id = ?`).run(Number(row.id));
    await syncDbToS3();
    const user = sanitizeUser(row);
    await setSessionCookie(user.id, user.role);

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "OTP verification failed. Please try again." }, { status: 500 });
  }
}
