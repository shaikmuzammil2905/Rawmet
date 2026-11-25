import { NextResponse } from "next/server";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { getCurrentSession } from "@/lib/data";

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
      businessCategory?: string; // "Industrial Products", "Machinery & Equipment", "Services"
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

      if (existingVendor) {
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

      // Create new common user
      const userIns = db
        .prepare(
          `INSERT INTO users (name, email, mobile, whatsapp, password_hash, role, status)
           VALUES (?, ?, ?, ?, ?, 'vendor', 'active')`
        )
        .run(
          ownerName,
          email,
          mobile,
          body.whatsapp || `91${mobile}`,
          hashPassword(password)
        );

      userId = Number(userIns.lastInsertRowid);
      await setSessionCookie(userId, "vendor");
    }

    const businessName = (body.businessName || "").trim();
    const gstNumber = (body.gstNumber || "").trim().toUpperCase();
    const address = (body.address || "").trim();
    const whatsapp = (body.whatsapp || mobile).replace(/\D/g, "");
    const businessType = body.businessType || "Manufacturer & Bulk Supplier";
    const businessCategory = body.businessCategory || "Industrial Products";
    const catSlug = (body.productServiceCategory || "rubber").trim();

    if (!ownerName || !businessName || mobile.length !== 10 || !email || !gstNumber || !address) {
      return NextResponse.json(
        {
          error:
            "Please fill all mandatory fields: Owner Name, Business Name, 10-digit Mobile, Business Email, GST/Authentic ID, and Business Address.",
        },
        { status: 400 }
      );
    }

    // Insert into vendors table
    const vendorIns = db
      .prepare(
        `INSERT INTO vendors (
          user_id, business_name, owner_name, mobile, whatsapp, email,
          business_category, product_service_category, gst_number, id_proof_type,
          id_proof_url, logo_url, address, city, state, description, product_details,
          verification_status, whatsapp_opt_in, whatsapp_categories, business_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
      )
      .run(
        userId,
        businessName,
        ownerName,
        mobile,
        whatsapp || `91${mobile}`,
        email,
        businessCategory,
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
        JSON.stringify([catSlug]),
        businessType
      );

    // Update user role to vendor so they have seller access while keeping buyer features
    db.prepare(`UPDATE users SET role = 'vendor' WHERE id = ?`).run(userId);

    await syncDbToS3();

    return NextResponse.json(
      {
        success: true,
        vendorId: Number(vendorIns.lastInsertRowid),
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
