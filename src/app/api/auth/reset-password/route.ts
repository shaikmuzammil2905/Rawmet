import { NextResponse } from "next/server";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashOtp, hashPassword, hashToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await syncDbFromS3(true);
    ensureSeeded();
    const { searchParams } = new URL(req.url);
    const token = (searchParams.get("token") || "").trim();
    const email = (searchParams.get("email") || "").trim().toLowerCase();
    const otp = (searchParams.get("otp") || "").trim();

    const db = getDb();

    if (token) {
      if (token.length !== 64) {
        return NextResponse.json(
          { valid: false, error: "Invalid password reset token format." },
          { status: 400 }
        );
      }

      const tokenHash = hashToken(token);
      const user = db
        .prepare(
          `SELECT id, email, reset_token_expires_at
           FROM users
           WHERE reset_token_hash = ? AND datetime(reset_token_expires_at) > datetime('now')
           LIMIT 1`
        )
        .get(tokenHash) as { id: number; email: string; reset_token_expires_at: string } | undefined;

      if (!user) {
        return NextResponse.json(
          {
            valid: false,
            error: "This password reset link is invalid, has expired, or has already been used.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ valid: true, email: user.email, mode: "token" });
    }

    if (email && otp) {
      if (!/^\d{6}$/.test(otp)) {
        return NextResponse.json({ valid: false, error: "Please enter a valid 6-digit OTP." }, { status: 400 });
      }
      const user = db
        .prepare(
          `SELECT id, email, otp_code, otp_expires_at, otp_attempts
           FROM users
           WHERE LOWER(email) = ?
           LIMIT 1`
        )
        .get(email) as
        | { id: number; email: string; otp_code: string; otp_expires_at: string; otp_attempts: number }
        | undefined;

      if (!user || !user.otp_code || !user.otp_expires_at) {
        return NextResponse.json(
          { valid: false, error: "No active reset OTP found for this email. Please request a new one." },
          { status: 400 }
        );
      }
      if (Number(user.otp_attempts || 0) >= 5) {
        return NextResponse.json(
          { valid: false, error: "Too many incorrect OTP attempts. Please request a new reset code." },
          { status: 429 }
        );
      }
      if (new Date(user.otp_expires_at).getTime() < Date.now()) {
        return NextResponse.json(
          { valid: false, error: "This reset OTP has expired. Please request a new one." },
          { status: 400 }
        );
      }
      if (user.otp_code !== hashOtp(otp)) {
        db.prepare(`UPDATE users SET otp_attempts = COALESCE(otp_attempts, 0) + 1 WHERE id = ?`).run(user.id);
        await syncDbToS3();
        return NextResponse.json({ valid: false, error: "Invalid 6-digit OTP code." }, { status: 400 });
      }

      return NextResponse.json({ valid: true, email: user.email, mode: "otp" });
    }

    return NextResponse.json(
      { valid: false, error: "Missing reset token or email OTP." },
      { status: 400 }
    );
  } catch (err) {
    console.error("reset-password GET error:", err);
    return NextResponse.json({ valid: false, error: "Unable to verify reset credentials." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await syncDbFromS3(true);
    ensureSeeded();
    const body = (await req.json()) as {
      token?: string;
      email?: string;
      otp?: string;
      password?: string;
    };
    const token = (body.token || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();
    const password = body.password || "";

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const db = getDb();
    let user: { id: number; email: string } | undefined;
    let methodLabel = "Password Changed via Reset Link";

    if (token) {
      if (token.length !== 64) {
        return NextResponse.json({ error: "Invalid password reset token format." }, { status: 400 });
      }
      const tokenHash = hashToken(token);
      user = db
        .prepare(
          `SELECT id, email
           FROM users
           WHERE reset_token_hash = ? AND datetime(reset_token_expires_at) > datetime('now')
           LIMIT 1`
        )
        .get(tokenHash) as { id: number; email: string } | undefined;

      if (!user) {
        return NextResponse.json(
          {
            error:
              "This password reset link is invalid, has expired, or has already been used. Please request a new one.",
          },
          { status: 400 }
        );
      }
    } else if (email && otp) {
      methodLabel = "Password Changed via Email OTP";
      if (!/^\d{6}$/.test(otp)) {
        return NextResponse.json({ error: "Please enter a valid 6-digit OTP code." }, { status: 400 });
      }
      const row = db
        .prepare(
          `SELECT id, email, otp_code, otp_expires_at, otp_attempts
           FROM users
           WHERE LOWER(email) = ?
           LIMIT 1`
        )
        .get(email) as
        | { id: number; email: string; otp_code: string; otp_expires_at: string; otp_attempts: number }
        | undefined;

      if (!row || !row.otp_code || !row.otp_expires_at) {
        return NextResponse.json(
          { error: "This reset OTP is invalid, expired, or has already been used." },
          { status: 400 }
        );
      }
      if (Number(row.otp_attempts || 0) >= 5) {
        return NextResponse.json(
          { error: "Too many incorrect OTP attempts. Please request a new reset email." },
          { status: 429 }
        );
      }
      if (new Date(row.otp_expires_at).getTime() < Date.now()) {
        return NextResponse.json(
          { error: "This reset OTP has expired. Please request a new one." },
          { status: 400 }
        );
      }
      if (row.otp_code !== hashOtp(otp)) {
        db.prepare(`UPDATE users SET otp_attempts = COALESCE(otp_attempts, 0) + 1 WHERE id = ?`).run(row.id);
        await syncDbToS3();
        return NextResponse.json({ error: "Invalid 6-digit OTP code." }, { status: 400 });
      }
      user = { id: row.id, email: row.email };
    } else {
      return NextResponse.json(
        { error: "Please provide a valid reset token or email + 6-digit OTP." },
        { status: 400 }
      );
    }

    const newPasswordHash = hashPassword(password);

    // Invalidate BOTH reset token and OTP immediately upon single use, and revoke existing sessions
    db.prepare(
      `UPDATE users
       SET password_hash = ?,
           reset_token_hash = '',
           reset_token_expires_at = '',
           otp_code = '',
           otp_expires_at = '',
           otp_attempts = 0,
           session_version = COALESCE(session_version, 1) + 1,
           last_login_at = datetime('now')
       WHERE id = ?`
    ).run(newPasswordHash, user.id);

    db.prepare(
      `INSERT INTO audit_logs (
         user_id, user_email, action, entity_type, entity_id,
         target_user_id, previous_status, new_status, details
       ) VALUES (?, ?, ?, 'user', ?, ?, 'active', 'password_updated', ?)`
    ).run(
      user.id,
      user.email,
      methodLabel,
      user.id,
      user.id,
      `Password updated for ${user.email}; previous sessions revoked.`
    );

    await syncDbToS3();

    return NextResponse.json({
      success: true,
      message: "Your password has been reset successfully. You can now log in with your new password.",
    });
  } catch (err) {
    console.error("reset-password POST error:", err);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again shortly." },
      { status: 500 }
    );
  }
}
