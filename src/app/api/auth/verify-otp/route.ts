import { NextResponse } from "next/server";
import { getDb, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashOtp, sanitizeUser, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    ensureSeeded();
    const body = (await req.json()) as { email?: string; mobile?: string; otp?: string };
    const email = (body.email || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "Please enter the valid 6-digit numeric verification code." },
        { status: 400 }
      );
    }

    const db = getDb();
    const row = db
      .prepare(`SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1`)
      .get(email) as Record<string, unknown> | undefined;

    if (!row) {
      return NextResponse.json(
        { error: "No account found associated with this email address." },
        { status: 404 }
      );
    }

    const currentAttempts = Number(row.otp_attempts || 0);

    // Limit check: Maximum 5 attempts per OTP
    if (currentAttempts >= 5) {
      db.prepare(`UPDATE users SET otp_code = '', otp_expires_at = '', otp_attempts = 0 WHERE id = ?`).run(
        Number(row.id)
      );
      await syncDbToS3();
      return NextResponse.json(
        {
          error:
            "Too many failed verification attempts. This verification code has been invalidated. Please request a new one.",
        },
        { status: 429 }
      );
    }

    // Expiry check (5 minutes)
    const expiresAtMs = row.otp_expires_at ? new Date(String(row.otp_expires_at)).getTime() : 0;
    if (!expiresAtMs || expiresAtMs < Date.now()) {
      return NextResponse.json(
        {
          error: "Verification code has expired (valid for 5 minutes). Please request a new code.",
        },
        { status: 400 }
      );
    }

    // Verify hashed OTP (with safe fallback for in-flight migrations)
    const storedCode = String(row.otp_code || "");
    const hashedInput = hashOtp(otp);
    const isMatch = storedCode === hashedInput || storedCode === otp;

    if (!isMatch) {
      const nextAttempts = currentAttempts + 1;
      db.prepare(`UPDATE users SET otp_attempts = ? WHERE id = ?`).run(nextAttempts, Number(row.id));
      await syncDbToS3();
      const remaining = Math.max(0, 5 - nextAttempts);
      return NextResponse.json(
        {
          error: `Incorrect verification code. Please check your email. (${remaining} attempt${
            remaining === 1 ? "" : "s"
          } remaining)`,
        },
        { status: 401 }
      );
    }

    // Single-use protection: Invalidate OTP immediately upon successful verification
    db.prepare(
      `UPDATE users 
       SET otp_code = '', 
           otp_expires_at = '', 
           otp_attempts = 0, 
           last_login_at = datetime('now') 
       WHERE id = ?`
    ).run(Number(row.id));

    await syncDbToS3();

    const user = sanitizeUser(row);
    await setSessionCookie(user.id, user.role);

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "OTP verification failed. Please try again." }, { status: 500 });
  }
}
