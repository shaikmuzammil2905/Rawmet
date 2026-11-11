import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { sanitizeUser, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    ensureSeeded();
    const body = (await req.json()) as { mobile?: string; otp?: string };
    const mobile = (body.mobile || "").replace(/\D/g, "").slice(-10);
    const otp = (body.otp || "").trim();

    if (mobile.length !== 10 || otp.length !== 6) {
      return NextResponse.json({ error: "Valid 10-digit mobile and 6-digit OTP required." }, { status: 400 });
    }

    const db = getDb();
    const row = db
      .prepare(`SELECT * FROM users WHERE mobile = ? LIMIT 1`)
      .get(mobile) as Record<string, unknown> | undefined;

    if (!row || String(row.otp_code) !== otp) {
      return NextResponse.json({ error: "Incorrect OTP code." }, { status: 401 });
    }

    if (!row.otp_expires_at || new Date(String(row.otp_expires_at)).getTime() < Date.now()) {
      return NextResponse.json({ error: "OTP has expired. Request a new code." }, { status: 401 });
    }

    db.prepare(`UPDATE users SET otp_code = '', otp_expires_at = '' WHERE id = ?`).run(Number(row.id));
    const user = sanitizeUser(row);
    await setSessionCookie(user.id, user.role);

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ error: "OTP verification failed." }, { status: 500 });
  }
}

