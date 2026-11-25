import { NextResponse } from "next/server";
import { getDb, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashPassword, hashToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    ensureSeeded();
    const { searchParams } = new URL(req.url);
    const token = (searchParams.get("token") || "").trim();

    if (!token || token.length !== 64) {
      return NextResponse.json(
        { valid: false, error: "Invalid password reset token format." },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const db = getDb();
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

    return NextResponse.json({ valid: true, email: user.email });
  } catch (err) {
    console.error("reset-password GET error:", err);
    return NextResponse.json({ valid: false, error: "Unable to verify reset link." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    ensureSeeded();
    const body = (await req.json()) as { token?: string; password?: string };
    const token = (body.token || "").trim();
    const password = body.password || "";

    if (!token || token.length !== 64) {
      return NextResponse.json(
        { error: "Invalid password reset token format." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const db = getDb();
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
          error:
            "This password reset link is invalid, has expired, or has already been used. Please request a new one.",
        },
        { status: 400 }
      );
    }

    // Hash new password using scrypt
    const newPasswordHash = hashPassword(password);

    // Invalidate reset token immediately upon single use and revoke existing sessions
    db.prepare(
      `UPDATE users 
       SET password_hash = ?, 
           reset_token_hash = '', 
           reset_token_expires_at = '', 
           session_version = COALESCE(session_version, 1) + 1,
           last_login_at = datetime('now') 
       WHERE id = ?`
    ).run(newPasswordHash, user.id);

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
