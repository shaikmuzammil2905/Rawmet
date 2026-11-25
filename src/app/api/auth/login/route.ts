import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { sanitizeUser, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    ensureSeeded();
    const body = (await req.json()) as {
      identifier?: string;
      password?: string;
      expectedRole?: "admin" | "vendor" | "customer";
    };

    const identifier = (body.identifier || "").trim().toLowerCase();
    const password = body.password || "";

    if (!identifier || !password) {
      return NextResponse.json({ error: "Email/mobile and password are required." }, { status: 400 });
    }

    const db = getDb();
    const row = db
      .prepare(
        `SELECT * FROM users WHERE LOWER(email) = ? OR mobile = ? LIMIT 1`
      )
      .get(identifier, identifier.replace(/^\+91/, "").replace(/\s+/g, "")) as
      | Record<string, unknown>
      | undefined;

    if (!row || !verifyPassword(password, String(row.password_hash))) {
      return NextResponse.json({ error: "Invalid credentials. Please check your email/mobile and password." }, { status: 401 });
    }

    if (row.status === "suspended") {
      return NextResponse.json({ error: "Your account is currently suspended. Contact customer care." }, { status: 403 });
    }

    if (body.expectedRole === "admin" && row.role !== "admin") {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    if (row.role === "vendor") {
      const vendorRow = db
        .prepare(`SELECT verification_status FROM vendors WHERE user_id = ? LIMIT 1`)
        .get(row.id) as { verification_status?: string } | undefined;

      if (vendorRow?.verification_status === "pending") {
        return NextResponse.json(
          {
            error:
              "Your seller registration is currently under admin verification. You will be able to access your seller dashboard once approved.",
            status: "pending",
          },
          { status: 403 }
        );
      }

      if (vendorRow?.verification_status === "rejected") {
        return NextResponse.json(
          {
            error: "Your seller registration was rejected by Admin. Please contact customer support.",
            status: "rejected",
          },
          { status: 403 }
        );
      }
    }

    const user = sanitizeUser(row);
    await setSessionCookie(user.id, user.role);

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json({ error: "Unable to complete login." }, { status: 500 });
  }
}

