import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb, syncDbFromS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { sanitizeUser, setSessionCookie, verifyPassword } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    await syncDbFromS3();
    ensureSeeded();

    const body = (await req.json()) as {
      action?: "password_login" | "request_otp" | "verify_otp";
      identifier?: string;
      email?: string;
      password?: string;
      otp?: string;
    };

    const action = body.action || "password_login";
    const rawEmail = (body.email || body.identifier || "").trim().toLowerCase();

    if (!rawEmail) {
      return NextResponse.json({ error: "Registered business email is required." }, { status: 400 });
    }

    const db = getDb();

    // 1. Find user by email or mobile
    const userRow = db
      .prepare(`SELECT * FROM users WHERE LOWER(email) = ? OR mobile = ? LIMIT 1`)
      .get(rawEmail, rawEmail.replace(/^\+91/, "").replace(/\s+/g, "")) as
      | Record<string, unknown>
      | undefined;

    if (!userRow) {
      return NextResponse.json(
        { error: "No account found with this email. Please check your email or register as a new seller." },
        { status: 404 }
      );
    }

    const userId = Number(userRow.id);

    // 2. Find matching vendor record
    const vendorRow = db
      .prepare(`SELECT * FROM vendors WHERE user_id = ? OR LOWER(email) = ? LIMIT 1`)
      .get(userId, rawEmail) as Record<string, unknown> | undefined;

    if (!vendorRow && userRow.role !== "vendor") {
      return NextResponse.json(
        {
          error:
            "This account is not registered as a seller. Please log in using the Customer/User Login or register your business.",
        },
        { status: 403 }
      );
    }

    const verificationStatus = vendorRow ? String(vendorRow.verification_status || "pending") : "approved";

    // Action A: Request OTP for Login
    if (action === "request_otp") {
      // Check status before sending OTP
      if (verificationStatus === "pending") {
        return NextResponse.json(
          {
            error:
              "Your seller registration is currently under admin verification. You will be able to access your seller dashboard once approved.",
            status: "pending",
          },
          { status: 403 }
        );
      }
      if (verificationStatus === "rejected") {
        return NextResponse.json(
          {
            error: "Your seller registration was rejected by Admin. Please contact customer support.",
            status: "rejected",
          },
          { status: 403 }
        );
      }

      const otp = String(crypto.randomInt(100000, 999999));
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      db.prepare(`UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?`).run(
        otp,
        expiresAt,
        userId
      );

      const emailResult = await sendOtpEmail(String(userRow.email), otp, "seller_login");

      if (!emailResult.success) {
        return NextResponse.json(
          { error: "Unable to send login verification email. Please check your email address or try again shortly." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Login OTP has been sent to ${userRow.email}. Please check your inbox.`,
      });
    }

    // Action B: Verify OTP & Login
    if (action === "verify_otp") {
      const otpInput = (body.otp || "").trim();
      if (!otpInput) {
        return NextResponse.json({ error: "Please enter the 6-digit OTP code." }, { status: 400 });
      }

      const storedOtp = String(userRow.otp_code || "");
      const expiresAt = String(userRow.otp_expires_at || "");

      if (!storedOtp || storedOtp !== otpInput) {
        return NextResponse.json({ error: "Invalid OTP code. Please enter the correct code." }, { status: 401 });
      }

      if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
        return NextResponse.json(
          { error: "This OTP has expired. Please request a new OTP code." },
          { status: 400 }
        );
      }

      // Check verification status
      if (verificationStatus === "pending") {
        return NextResponse.json(
          {
            error:
              "Your seller registration is currently under admin verification. You will be able to access your seller dashboard once approved.",
            status: "pending",
          },
          { status: 403 }
        );
      }

      if (verificationStatus === "rejected") {
        return NextResponse.json(
          {
            error: "Your seller registration was rejected by Admin. Please contact customer support.",
            status: "rejected",
          },
          { status: 403 }
        );
      }

      // Clear OTP
      db.prepare(`UPDATE users SET otp_code = '', otp_expires_at = '' WHERE id = ?`).run(userId);

      const user = sanitizeUser(userRow);
      await setSessionCookie(user.id, "vendor");

      return NextResponse.json({
        success: true,
        message: "Logged in successfully!",
        user,
        vendor: vendorRow,
        redirect: "/vendor/dashboard",
      });
    }

    // Action C: Password Login
    const password = body.password || "";
    if (!password) {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    if (!verifyPassword(password, String(userRow.password_hash))) {
      return NextResponse.json(
        { error: "Incorrect password. Please verify your credentials or use Forgot Password / OTP Login." },
        { status: 401 }
      );
    }

    if (userRow.status === "suspended") {
      return NextResponse.json(
        { error: "Your seller account is currently suspended. Please contact customer support." },
        { status: 403 }
      );
    }

    // Admin Approval Check:
    if (verificationStatus === "pending") {
      return NextResponse.json(
        {
          error:
            "Your seller registration is currently under admin verification. You will be able to access your seller dashboard once approved.",
          status: "pending",
          businessName: vendorRow?.business_name,
        },
        { status: 403 }
      );
    }

    if (verificationStatus === "rejected") {
      return NextResponse.json(
        {
          error: "Your seller registration was rejected by Admin. Please contact customer support.",
          status: "rejected",
        },
        { status: 403 }
      );
    }

    const user = sanitizeUser(userRow);
    await setSessionCookie(user.id, "vendor");

    return NextResponse.json({
      success: true,
      message: `Welcome back, ${vendorRow?.business_name || user.name}!`,
      user,
      vendor: vendorRow,
      redirect: "/vendor/dashboard",
    });
  } catch (err: unknown) {
    console.error("Seller login error:", err);
    return NextResponse.json({ error: "Unable to complete seller login. Please try again." }, { status: 500 });
  }
}
