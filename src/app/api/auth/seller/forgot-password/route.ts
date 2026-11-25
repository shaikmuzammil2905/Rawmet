import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb, syncDbFromS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashPassword } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    await syncDbFromS3();
    ensureSeeded();

    const body = (await req.json()) as {
      action?: "request_otp" | "reset_password";
      email?: string;
      otp?: string;
      newPassword?: string;
    };

    const action = body.action || "request_otp";
    const rawEmail = (body.email || "").trim().toLowerCase();

    if (!rawEmail) {
      return NextResponse.json({ error: "Registered business email is required." }, { status: 400 });
    }

    const db = getDb();

    // Check if user exists
    const userRow = db
      .prepare(`SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1`)
      .get(rawEmail) as Record<string, unknown> | undefined;

    if (!userRow) {
      return NextResponse.json(
        { error: "No account found matching this email address." },
        { status: 404 }
      );
    }

    const userId = Number(userRow.id);

    // Step 1: Send OTP to email
    if (action === "request_otp") {
      const otp = String(crypto.randomInt(100000, 999999));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      db.prepare(`UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?`).run(
        otp,
        expiresAt,
        userId
      );

      const emailResult = await sendOtpEmail(rawEmail, otp, "password_reset");

      if (!emailResult.success) {
        return NextResponse.json(
          { error: "Unable to send password reset email. Please check your email address or try again shortly." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Password reset code sent to ${rawEmail}. Please check your inbox.`,
      });
    }

    // Step 2: Verify OTP and update password
    if (action === "reset_password") {
      const otpInput = (body.otp || "").trim();
      const newPassword = body.newPassword || "";

      if (!otpInput) {
        return NextResponse.json({ error: "Please enter the 6-digit OTP code." }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      const storedOtp = String(userRow.otp_code || "");
      const expiresAt = String(userRow.otp_expires_at || "");

      if (!storedOtp || storedOtp !== otpInput) {
        return NextResponse.json({ error: "Invalid OTP code. Please check and try again." }, { status: 401 });
      }

      if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
        return NextResponse.json(
          { error: "This OTP code has expired. Please request a new one." },
          { status: 400 }
        );
      }

      const newHash = hashPassword(newPassword);

      db.prepare(
        `UPDATE users SET password_hash = ?, otp_code = '', otp_expires_at = '' WHERE id = ?`
      ).run(newHash, userId);

      return NextResponse.json({
        success: true,
        message: "Password reset successfully! You can now log in with your new password.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: unknown) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Unable to process password reset request. Please try again." },
      { status: 500 }
    );
  }
}
