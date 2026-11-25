import { NextResponse } from "next/server";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { getCurrentSession } from "@/lib/data";
import { sendSellerApplicationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    await syncDbFromS3();
    ensureSeeded();

    const session = await getCurrentSession();
    const body = (await req.json()) as {
      ownerName?: string;
      businessName?: string;
      mobile?: string;
      whatsapp?: string;
      email?: string;
      password?: string;
      businessType?: string;
      businessCategory?: string; // "Products", "Industries", "Services"
      primaryCategory?: string;
      productServiceCategory?: string;
      gstNumber?: string;
      businessProofType?: string;
      businessProofNumber?: string;
      idProofType?: string;
      idProofUrl?: string;
      logoUrl?: string;
      address?: string;
      doorNo?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      country?: string;
      pincode?: string;
      description?: string;
      productDetails?: string;
      whatsappOptIn?: boolean;
    };

    const db = getDb();

    // If user is already logged in, use their existing account
    let userId: number;
    let ownerName = (body.ownerName || "").trim();
    let email = (body.email || "").trim().toLowerCase();
    let mobile = (body.mobile || "").replace(/\D/g, "").slice(-10);

    if (session) {
      userId = session.user.id;
      ownerName = ownerName || session.user.name;
      email = email || session.user.email;
      mobile = mobile || session.user.mobile;

      // Check if this user already applied as a seller
      const existingVendor = db
        .prepare(`SELECT * FROM vendors WHERE user_id = ?`)
        .get(userId) as Record<string, unknown> | undefined;

      if (existingVendor && existingVendor.verification_status !== "rejected") {
        return NextResponse.json(
          {
            error: "You have already submitted a seller application.",
            status: existingVendor.verification_status,
          },
          { status: 409 }
        );
      }
    } else {
      // User is not logged in: validate password to create new common account
      const password = body.password || "";
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }

      // Check if user already exists
      const existingUser = db
        .prepare(`SELECT id FROM users WHERE LOWER(email) = ? OR mobile = ? LIMIT 1`)
        .get(email, mobile) as { id: number } | undefined;

      if (existingUser) {
        return NextResponse.json(
          {
            error:
              "An account with this email or mobile already exists. Please sign in to apply as a seller using your common account.",
          },
          { status: 409 }
        );
      }

      // Create new common user (stays 'customer' until Admin approves seller application)
      const userIns = db
        .prepare(
          `INSERT INTO users (name, email, mobile, whatsapp, password_hash, role, status)
           VALUES (?, ?, ?, ?, ?, 'customer', 'active')`
        )
        .run(
          ownerName,
          email,
          mobile,
          body.whatsapp || `91${mobile}`,
          hashPassword(password)
        );

      userId = Number(userIns.lastInsertRowid);
      await setSessionCookie(userId, "customer", 1);
    }

    const businessName = (body.businessName || "").trim();
    const primaryCategory = (body.primaryCategory || body.businessCategory || "Products").trim();
    const businessProofType = (body.businessProofType || body.idProofType || "GST Registration").trim();
    const businessProofNumber = (body.businessProofNumber || body.gstNumber || "").trim().toUpperCase();
    const gstNumber = businessProofNumber; // Backward compatibility

    const country = (body.country || "India").trim();
    const city = (body.city || "").trim();
    const state = (body.state || "").trim();
    const doorNo = (body.doorNo || "").trim();
    const addressLine1 = (body.addressLine1 || "").trim();
    const addressLine2 = (body.addressLine2 || "").trim();
    const pincode = (body.pincode || "").trim();

    const fullAddress = (
      body.address ||
      [doorNo, addressLine1, addressLine2, city, state, pincode, country].filter(Boolean).join(", ")
    ).trim();

    const whatsapp = (body.whatsapp || mobile).replace(/\D/g, "");
    const businessType = body.businessType || "Manufacturer & Bulk Supplier";
    const catSlug = (body.productServiceCategory || "rubber").trim();

    if (!ownerName || !businessName || mobile.length !== 10 || !email || !businessProofNumber || (!fullAddress && !city)) {
      return NextResponse.json(
        {
          error:
            "Please fill all required fields: Business Name, Business Proof Number, City, and Address.",
        },
        { status: 400 }
      );
    }

    // Controlled resubmission if rejected; otherwise insert new vendor application as 'pending'
    const existingRejected = db
      .prepare(`SELECT id FROM vendors WHERE user_id = ? AND verification_status = 'rejected' LIMIT 1`)
      .get(userId) as { id: number } | undefined;

    let vendorId: number;
    if (existingRejected) {
      db.prepare(
        `UPDATE vendors SET
          business_name = ?, owner_name = ?, mobile = ?, whatsapp = ?, email = ?,
          business_category = ?, product_service_category = ?, gst_number = ?, id_proof_type = ?,
          id_proof_url = ?, logo_url = ?, address = ?, city = ?, state = ?, description = ?,
          product_details = ?, verification_status = 'pending', rejection_reason = '',
          whatsapp_opt_in = ?, whatsapp_categories = ?, business_type = ?,
          country = ?, door_no = ?, address_line1 = ?, address_line2 = ?, pincode = ?,
          business_proof_type = ?, business_proof_number = ?, primary_category = ?,
          updated_at = datetime('now')
         WHERE id = ?`
      ).run(
        businessName,
        ownerName,
        mobile,
        whatsapp || `91${mobile}`,
        email,
        primaryCategory,
        catSlug,
        gstNumber,
        businessProofType,
        body.idProofUrl || "",
        body.logoUrl || "/images/rawmet-logo.png",
        fullAddress,
        city,
        state,
        body.description || "",
        body.productDetails || "",
        body.whatsappOptIn === false ? 0 : 1,
        JSON.stringify([catSlug]),
        businessType,
        country,
        doorNo,
        addressLine1,
        addressLine2,
        pincode,
        businessProofType,
        businessProofNumber,
        primaryCategory,
        existingRejected.id
      );
      vendorId = existingRejected.id;
    } else {
      const vendorIns = db
        .prepare(
          `INSERT INTO vendors (
            user_id, business_name, owner_name, mobile, whatsapp, email,
            business_category, product_service_category, gst_number, id_proof_type,
            id_proof_url, logo_url, address, city, state, description, product_details,
            verification_status, whatsapp_opt_in, whatsapp_categories, business_type,
            country, door_no, address_line1, address_line2, pincode,
            business_proof_type, business_proof_number, primary_category, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        )
        .run(
          userId,
          businessName,
          ownerName,
          mobile,
          whatsapp || `91${mobile}`,
          email,
          primaryCategory,
          catSlug,
          gstNumber,
          businessProofType,
          body.idProofUrl || "",
          body.logoUrl || "/images/rawmet-logo.png",
          fullAddress,
          city,
          state,
          body.description || "",
          body.productDetails || "",
          body.whatsappOptIn === false ? 0 : 1,
          JSON.stringify([catSlug]),
          businessType,
          country,
          doorNo,
          addressLine1,
          addressLine2,
          pincode,
          businessProofType,
          businessProofNumber,
          primaryCategory
        );
      vendorId = Number(vendorIns.lastInsertRowid);
    }

    db.prepare(
      `INSERT INTO audit_logs (user_id, user_email, action, details)
       VALUES (?, ?, 'vendor_application_submitted', ?)`
    ).run(userId, email, `Seller application #${vendorId} (${businessName}) submitted as pending.`);

    await syncDbToS3();

    // Send confirmation email via Nodemailer (best-effort)
    sendSellerApplicationEmail(email, ownerName, businessName, "received").catch((e) =>
      console.error("Failed to send seller application received email:", e)
    );

    return NextResponse.json(
      {
        success: true,
        vendorId,
        status: "pending",
        message:
          "Your seller application has been submitted successfully! It is now under admin verification.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Seller registration error:", err);
    return NextResponse.json({ error: "Failed to submit seller application." }, { status: 500 });
  }
}
