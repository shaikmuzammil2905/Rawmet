import { NextResponse } from "next/server";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashPassword, setSessionCookie, verifyPassword } from "@/lib/auth";
import { getCurrentSession } from "@/lib/data";

export async function POST(req: Request) {
  try {
    await syncDbFromS3(true);
    ensureSeeded();

    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const currentPassword = body.currentPassword || "";
    const newPassword = body.newPassword || "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const db = getDb();
    const userRow = db
      .prepare(`SELECT id, email, role, password_hash, session_version FROM users WHERE id = ? LIMIT 1`)
      .get(session.user.id) as
      | { id: number; email: string; role: "admin" | "vendor" | "customer"; password_hash: string; session_version?: number }
      | undefined;

    if (!userRow || !verifyPassword(currentPassword, userRow.password_hash)) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const nextHash = hashPassword(newPassword);
    const nextSessionVersion = Number(userRow.session_version || 1) + 1;

    db.prepare(
      `UPDATE users
       SET password_hash = ?,
           session_version = ?,
           reset_token_hash = '',
           reset_token_expires_at = '',
           otp_code = '',
           otp_expires_at = ''
       WHERE id = ?`
    ).run(nextHash, nextSessionVersion, userRow.id);

    db.prepare(
      `INSERT INTO audit_logs (
         user_id, user_email, action, entity_type, entity_id,
         target_user_id, previous_status, new_status, details
       ) VALUES (?, ?, 'Password Changed', 'user', ?, ?, 'active', 'password_updated', ?)`
    ).run(
      userRow.id,
      userRow.email,
      userRow.id,
      userRow.id,
      `Authenticated user ${userRow.email} changed their password.`
    );

    await syncDbToS3();
    await setSessionCookie(userRow.id, userRow.role, nextSessionVersion);

    return NextResponse.json({
      success: true,
      message: "Your password has been updated successfully.",
    });
  } catch (err) {
    console.error("change-password error:", err);
    return NextResponse.json(
      { error: "Unable to update password. Please try again." },
      { status: 500 }
    );
  }
}
