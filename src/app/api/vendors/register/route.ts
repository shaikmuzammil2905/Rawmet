import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    ensureSeeded();
    const body = (await req.json()) as {
      ownerName?: string;
      businessName?: string;
      mobile?: string;
      whatsapp?: string;
      email?: string;
      password?: string;
      businessCategory?: string;
      productServiceCategory?: string;
      gstNumber?: string;
      idProofType?: string;
      idProofUrl?: string;
      logoUrl?: string;
      address?: string;
      city?: string;
      state?: string;
      description?: string;
      productDetails?: string;
      whatsappOptIn?: boolean;
    };

    const ownerName = (body.ownerName || "").trim();
    const businessName = (body.businessName || "").trim();
    const mobile = (body.mobile || "").replace(/\D/g, "").slice(-10);
    const whatsapp = (body.whatsapp || mobile).replace(/\D/g, "");
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const gstNumber = (body.gstNumber || "").trim().toUpperCase();
    const address = (body.address || "").trim();

    if (!ownerName || !businessName || mobile.length !== 10 || !email || password.length < 6 || !gstNumber || !address) {
      return NextResponse.json(
        { error: "Please fill all mandatory fields including valid 10-digit mobile, password (min 6 chars), GST/Authentic ID, and business address." },
        { status: 400 }
      );
    }

    const db = getDb();
    const exists = db.prepare(`SELECT id FROM users WHERE LOWER(email) = ? OR mobile = ?`).get(email, mobile);
    if (exists) {
      return NextResponse.json(
        { error: "An account with this email or mobile already exists. Please login instead." },
        { status: 409 }
      );
    }

    const catSlug = (body.productServiceCategory || "rubber").trim();

    db.exec("BEGIN TRANSACTION");
    try {
      const userIns = db
        .prepare(
          `INSERT INTO users (name, email, mobile, whatsapp, password_hash, role, status)
           VALUES (?, ?, ?, ?, ?, 'vendor', 'active')`
        )
        .run(ownerName, email, mobile, whatsapp || `91${mobile}`, hashPassword(password));

      const userId = Number(userIns.lastInsertRowid);

      const vendorIns = db
        .prepare(
          `INSERT INTO vendors (
            user_id, business_name, owner_name, mobile, whatsapp, email,
            business_category, product_service_category, gst_number, id_proof_type,
            id_proof_url, logo_url, address, city, state, description, product_details,
            verification_status, whatsapp_opt_in, whatsapp_categories
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
        )
        .run(
          userId,
          businessName,
          ownerName,
          mobile,
          whatsapp || `91${mobile}`,
          email,
          body.businessCategory || "Manufacturer & Supplier",
          catSlug,
          gstNumber,
          body.idProofType || "GST Certificate",
          body.idProofUrl || "",
          body.logoUrl || "/images/rawmet-logo.png",
          address,
          body.city || "",
          body.state || "",
          body.description || "",
          body.productDetails || "",
          body.whatsappOptIn === false ? 0 : 1,
          JSON.stringify([catSlug])
        );

      db.exec("COMMIT");
      await setSessionCookie(userId, "vendor");

      return NextResponse.json(
        {
          success: true,
          vendorId: Number(vendorIns.lastInsertRowid),
          message: "Vendor registration submitted! Your GST/ID verification is Pending Admin Approval.",
        },
        { status: 201 }
      );
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  } catch {
    return NextResponse.json({ error: "Vendor registration failed." }, { status: 500 });
  }
}

