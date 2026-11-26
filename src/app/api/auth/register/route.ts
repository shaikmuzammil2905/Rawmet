import { NextResponse } from "next/server";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashPassword, sanitizeUser, setSessionCookie } from "@/lib/auth";
import { sendWelcomeRegistrationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    await syncDbFromS3(true);
    ensureSeeded();
    const body = (await req.json()) as {
      name?: string;
      email?: string;
      mobile?: string;
      whatsapp?: string;
      password?: string;
    };

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const mobile = (body.mobile || "").replace(/\D/g, "").slice(-10);
    const whatsapp = (body.whatsapp || mobile).replace(/\D/g, "");
    const password = body.password || "";

    if (!name || !email || mobile.length !== 10 || password.length < 6) {
      return NextResponse.json(
        { error: "Provide valid name, email, 10-digit mobile number, and password (min 6 chars)." },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = db
      .prepare(`SELECT id FROM users WHERE LOWER(email) = ? OR mobile = ?`)
      .get(email, mobile);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email or mobile number already exists." },
        { status: 409 }
      );
    }

    const result = db
      .prepare(
        `INSERT INTO users (name, email, mobile, whatsapp, password_hash, role, status)
         VALUES (?, ?, ?, ?, ?, 'customer', 'active')`
      )
      .run(name, email, mobile, whatsapp || `91${mobile}`, hashPassword(password));

    const userRow = db
      .prepare(`SELECT id, name, email, mobile, whatsapp, role, status, created_at FROM users WHERE id = ?`)
      .get(result.lastInsertRowid) as Record<string, unknown>;

    const user = sanitizeUser(userRow);
    await syncDbToS3();
    await setSessionCookie(user.id, user.role);

    // Send real confirmation welcome email
    sendWelcomeRegistrationEmail(email, name).catch((err) => {
      console.warn("sendWelcomeRegistrationEmail async error:", err);
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}

