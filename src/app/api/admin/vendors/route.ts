import { NextResponse } from "next/server";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { requireRole } from "@/lib/data";
import { sendSellerApplicationEmail } from "@/lib/email";

export async function PATCH(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = (await req.json()) as {
    vendorId?: number;
    verificationStatus?: "pending" | "approved" | "rejected" | "suspended";
    rejectionReason?: string;
  };

  if (!body.vendorId || !body.verificationStatus) {
    return NextResponse.json({ error: "vendorId and verificationStatus are required." }, { status: 400 });
  }

  const allowedStatuses = new Set(["pending", "approved", "rejected", "suspended"]);
  if (!allowedStatuses.has(body.verificationStatus)) {
    return NextResponse.json({ error: "Invalid verificationStatus." }, { status: 400 });
  }

  try {
    await syncDbFromS3(true);
    const db = getDb();

    const vendor = db
      .prepare(
        `SELECT v.*, u.role as user_role, u.email as user_email
         FROM vendors v
         LEFT JOIN users u ON u.id = v.user_id
         WHERE v.id = ?`
      )
      .get(body.vendorId) as Record<string, unknown> | undefined;

    if (!vendor) {
      return NextResponse.json({ error: "Seller application not found." }, { status: 404 });
    }

    const status = body.verificationStatus;
    const reasonText =
      status === "rejected"
        ? (body.rejectionReason || "Your seller application has not been approved. Please contact RAWMAT MART support for further information.").trim()
        : status === "suspended"
        ? (body.rejectionReason || "Seller account temporarily deactivated by Admin.").trim()
        : "";

    const approvedAtClause = status === "approved" ? "datetime('now')" : "approved_at";
    const rejectedAtClause = status === "rejected" ? "datetime('now')" : "rejected_at";

    db.exec("BEGIN");
    try {
      db.prepare(
        `UPDATE vendors
         SET verification_status = ?,
             rejection_reason = ?,
             approved_at = ${approvedAtClause},
             rejected_at = ${rejectedAtClause},
             reviewed_by_admin_id = ?,
             updated_at = datetime('now')
         WHERE id = ?`
      ).run(status, reasonText, session.user.id, body.vendorId);

      // Activate or revoke seller role on the linked common user account (preserving admin if admin)
      if (vendor.user_id && vendor.user_role !== "admin") {
        const nextRole = status === "approved" ? "vendor" : "customer";
        db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(nextRole, vendor.user_id);
      }

      // Audit log
      db.prepare(`
        INSERT INTO audit_logs (user_id, user_email, action, details)
        VALUES (?, ?, 'vendor_status_update', ?)
      `).run(
        session.user.id,
        session.user.email,
        `Vendor #${body.vendorId} (${vendor.business_name}) status set to ${status}${reasonText ? ` (Reason: ${reasonText})` : ""}`
      );
      db.exec("COMMIT");
    } catch (txErr) {
      db.exec("ROLLBACK");
      throw txErr;
    }

    await syncDbToS3();

    // Send real email notification via Nodemailer if configured
    const notifyEmail = String(vendor.email || vendor.user_email || "").trim();
    if (notifyEmail && (status === "approved" || status === "rejected" || status === "suspended")) {
      sendSellerApplicationEmail(
        notifyEmail,
        String(vendor.owner_name || "Partner"),
        String(vendor.business_name || "Your Business"),
        status,
        reasonText
      ).catch((e) => console.error("Vendor status email dispatch error:", e));
    }

    return NextResponse.json({
      success: true,
      status,
      message: `Seller status updated to ${status}.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update vendor.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  try {
    await syncDbFromS3(true);
    const body = (await req.json()) as {
      vendorId?: number;
      business_name?: string;
      owner_name?: string;
      mobile?: string;
      whatsapp?: string;
      email?: string;
      business_type?: string;
      primary_category?: string;
      business_proof_type?: string;
      business_proof_number?: string;
      gst_number?: string;
      door_no?: string;
      address_line1?: string;
      address_line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
      description?: string;
    };

    if (!body.vendorId) {
      return NextResponse.json({ error: "vendorId is required." }, { status: 400 });
    }

    const db = getDb();
    const existing = db
      .prepare(`SELECT * FROM vendors WHERE id = ?`)
      .get(body.vendorId) as Record<string, unknown> | undefined;

    if (!existing) {
      return NextResponse.json({ error: "Seller application not found." }, { status: 404 });
    }

    const doorNo = body.door_no ?? String(existing.door_no || "");
    const line1 = body.address_line1 ?? String(existing.address_line1 || "");
    const line2 = body.address_line2 ?? String(existing.address_line2 || "");
    const city = body.city ?? String(existing.city || "");
    const state = body.state ?? String(existing.state || "");
    const pincode = body.pincode ?? String(existing.pincode || "");
    const country = body.country ?? String(existing.country || "India");

    const composedAddress =
      [doorNo, line1, line2, city, state, pincode, country].filter(Boolean).join(", ") ||
      String(existing.address || "");

    const proofNum = (body.business_proof_number ?? body.gst_number ?? String(existing.business_proof_number || existing.gst_number || "")).trim();
    const proofType = (body.business_proof_type ?? String(existing.business_proof_type || existing.id_proof_type || "GST Registration")).trim();
    const primaryCat = (body.primary_category ?? String(existing.primary_category || existing.business_category || "Products")).trim();

    db.prepare(
      `UPDATE vendors SET
         business_name = ?,
         owner_name = ?,
         mobile = ?,
         whatsapp = ?,
         email = ?,
         business_type = ?,
         primary_category = ?,
         business_category = ?,
         business_proof_type = ?,
         id_proof_type = ?,
         business_proof_number = ?,
         gst_number = ?,
         door_no = ?,
         address_line1 = ?,
         address_line2 = ?,
         city = ?,
         state = ?,
         pincode = ?,
         country = ?,
         address = ?,
         description = ?,
         reviewed_by_admin_id = ?,
         updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      (body.business_name ?? String(existing.business_name)).trim(),
      (body.owner_name ?? String(existing.owner_name)).trim(),
      (body.mobile ?? String(existing.mobile)).trim(),
      (body.whatsapp ?? String(existing.whatsapp)).trim(),
      (body.email ?? String(existing.email)).trim(),
      (body.business_type ?? String(existing.business_type || "Manufacturer & Bulk Supplier")).trim(),
      primaryCat,
      primaryCat,
      proofType,
      proofType,
      proofNum,
      proofNum,
      doorNo.trim(),
      line1.trim(),
      line2.trim(),
      city.trim(),
      state.trim(),
      pincode.trim(),
      country.trim(),
      composedAddress,
      (body.description ?? String(existing.description || "")).trim(),
      session.user.id,
      body.vendorId
    );

    db.prepare(
      `INSERT INTO audit_logs (user_id, user_email, action, details)
       VALUES (?, ?, 'vendor_details_updated', ?)`
    ).run(
      session.user.id,
      session.user.email,
      `Admin updated details for Seller #${body.vendorId} (${body.business_name || existing.business_name})`
    );

    await syncDbToS3();

    return NextResponse.json({
      success: true,
      message: "Seller business and verification details updated successfully.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to update seller details.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
