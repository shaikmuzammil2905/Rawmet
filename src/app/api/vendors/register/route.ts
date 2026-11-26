import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { getCurrentSession } from "@/lib/data";
import { sendSellerApplicationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    await syncDbFromS3(true);
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
      selectedBusinessTypes?: string[];
      selectedCategories?: string[];
      selectedSubcategories?: string[];
      otherBusinessType?: string;
      otherCategories?: string[];
      otherSubcategories?: string[];
    };

    const db = getDb();

    // If user is already logged in, use their existing account
    let userId: number = 0;
    let ownerName = (body.ownerName || "").trim();
    let email = (body.email || "").trim().toLowerCase();
    let mobile = (body.mobile || "").replace(/\D/g, "").slice(-10);

    if (session) {
      userId = session.user.id;
      ownerName = ownerName || session.user.name;
      email = email || session.user.email;
      mobile = mobile || session.user.mobile;

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
      const password = body.password || "";
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }

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
    }

    const businessName = (body.businessName || "").trim();
    const selectedBusinessTypes = Array.isArray(body.selectedBusinessTypes)
      ? body.selectedBusinessTypes.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const selectedCategories = Array.isArray(body.selectedCategories)
      ? body.selectedCategories.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const selectedSubcategories = Array.isArray(body.selectedSubcategories)
      ? body.selectedSubcategories.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const otherBusinessType = (body.otherBusinessType || "").trim();
    const otherCategories = Array.isArray(body.otherCategories)
      ? body.otherCategories.map((s) => String(s).trim()).filter(Boolean)
      : [];
    const otherSubcategories = Array.isArray(body.otherSubcategories)
      ? body.otherSubcategories.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const primaryCategory = (
      selectedBusinessTypes[0] ||
      body.primaryCategory ||
      body.businessCategory ||
      "Products"
    ).trim();
    const businessProofType = (body.businessProofType || body.idProofType || "Business Requirements").trim();
    const businessProofNumber = (body.businessProofNumber || body.gstNumber || "").trim().toUpperCase();
    const legalName = ((body as { legalName?: string }).legalName || businessName).trim();
    const gstNumber = businessProofNumber; // Optional backward compatibility

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
    const catSlug = (selectedCategories[0] || body.productServiceCategory || "rubber").trim();

    if (!ownerName || !businessName || mobile.length !== 10 || !email || (!fullAddress && !city)) {
      return NextResponse.json(
        {
          error:
            "Please fill all required fields: Business Name, City, and Address.",
        },
        { status: 400 }
      );
    }

    const effectiveBusinessTypes =
      selectedBusinessTypes.length > 0 ? selectedBusinessTypes : [primaryCategory];

    // Validate submitted category/subcategory slugs against master catalog
    const allMasterCats = db
      .prepare(`SELECT id, type, name, slug FROM categories WHERE is_active = 1`)
      .all() as Array<{ id: number; type: string; name: string; slug: string }>;
    const catBySlug = new Map(allMasterCats.map((c) => [c.slug, c]));

    const validCatSlugs = selectedCategories.filter((slug) => catBySlug.has(slug));
    const nonOtherSelected = effectiveBusinessTypes.some((bt) => bt.toLowerCase() !== "other");
    if (
      Array.isArray(body.selectedBusinessTypes) &&
      nonOtherSelected &&
      validCatSlugs.length === 0 &&
      otherCategories.length === 0
    ) {
      return NextResponse.json(
        { error: "Please select at least one category (or Other) for your business." },
        { status: 400 }
      );
    }

    const allMasterSubs = db
      .prepare(`SELECT id, category_id, name, slug FROM subcategories`)
      .all() as Array<{ id: number; category_id: number; name: string; slug: string }>;
    const subBySlug = new Map(allMasterSubs.map((s) => [s.slug, s]));
    const validSubSlugs = selectedSubcategories.filter((slug) => subBySlug.has(slug));

    // Create user account only AFTER all form & category validations succeed
    if (!session) {
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
          hashPassword(body.password || "")
        );
      userId = Number(userIns.lastInsertRowid);
      await setSessionCookie(userId, "vendor", 1);
    }

    // Automatic approval & activation per onboarding flow!
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
          product_details = ?, verification_status = 'approved', rejection_reason = '',
          approved_at = datetime('now'),
          whatsapp_opt_in = ?, whatsapp_categories = ?, business_type = ?,
          country = ?, door_no = ?, address_line1 = ?, address_line2 = ?, pincode = ?,
          business_proof_type = ?, business_proof_number = ?, primary_category = ?, legal_name = ?,
          selected_business_types = ?, selected_categories = ?, selected_subcategories = ?,
          other_business_type = ?, other_categories = ?, other_subcategories = ?,
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
        JSON.stringify(validCatSlugs.length > 0 ? validCatSlugs : [catSlug]),
        businessType,
        country,
        doorNo,
        addressLine1,
        addressLine2,
        pincode,
        businessProofType,
        businessProofNumber,
        primaryCategory,
        legalName,
        JSON.stringify(effectiveBusinessTypes),
        JSON.stringify(validCatSlugs),
        JSON.stringify(validSubSlugs),
        otherBusinessType,
        JSON.stringify(otherCategories),
        JSON.stringify(otherSubcategories),
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
            verification_status, approved_at, whatsapp_opt_in, whatsapp_categories, business_type,
            country, door_no, address_line1, address_line2, pincode,
            business_proof_type, business_proof_number, primary_category, legal_name,
            selected_business_types, selected_categories, selected_subcategories,
            other_business_type, other_categories, other_subcategories, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
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
          JSON.stringify(validCatSlugs.length > 0 ? validCatSlugs : [catSlug]),
          businessType,
          country,
          doorNo,
          addressLine1,
          addressLine2,
          pincode,
          businessProofType,
          businessProofNumber,
          primaryCategory,
          legalName,
          JSON.stringify(effectiveBusinessTypes),
          JSON.stringify(validCatSlugs),
          JSON.stringify(validSubSlugs),
          otherBusinessType,
          JSON.stringify(otherCategories),
          JSON.stringify(otherSubcategories)
        );
      vendorId = Number(vendorIns.lastInsertRowid);
    }

    // Store structured relational selections in vendor_catalog_selections
    db.prepare(`DELETE FROM vendor_catalog_selections WHERE vendor_id = ?`).run(vendorId);
    const insSel = db.prepare(`
      INSERT INTO vendor_catalog_selections (
        vendor_id, business_type, category_id, category_slug, category_name,
        subcategory_id, subcategory_slug, subcategory_name, is_other, other_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const cSlug of validCatSlugs) {
      const cat = catBySlug.get(cSlug);
      if (!cat) continue;
      const bTypeLabel =
        effectiveBusinessTypes.find((bt) => {
          const l = bt.toLowerCase();
          if (cat.type === "product") return l === "products" || l === "product" || l === "industrial products";
          if (cat.type === "machinery") return l === "industry" || l === "industries" || l === "machinery";
          return l === "services" || l === "service";
        }) || primaryCategory;

      const subsForCat = validSubSlugs
        .map((s) => subBySlug.get(s))
        .filter((s): s is { id: number; category_id: number; name: string; slug: string } => Boolean(s && s.category_id === cat.id));

      if (subsForCat.length === 0) {
        insSel.run(vendorId, bTypeLabel, cat.id, cat.slug, cat.name, null, "", "", 0, "");
      } else {
        for (const sub of subsForCat) {
          insSel.run(vendorId, bTypeLabel, cat.id, cat.slug, cat.name, sub.id, sub.slug, sub.name, 0, "");
        }
      }
    }

    if (otherBusinessType) {
      insSel.run(vendorId, "Other", null, "other", "Other", null, "", "", 1, otherBusinessType);
    }
    for (const oc of otherCategories) {
      insSel.run(vendorId, primaryCategory, null, "other", oc, null, "", "", 1, oc);
    }
    for (const os of otherSubcategories) {
      insSel.run(vendorId, primaryCategory, null, "other", "Other", null, "other", os, 1, os);
    }

    // Automatically activate seller role on user account (preserve admin role if admin)
    const userRow = db
      .prepare(`SELECT role, session_version FROM users WHERE id = ?`)
      .get(userId) as { role: string; session_version?: number } | undefined;
    const nextRole = userRow?.role === "admin" ? "admin" : "vendor";
    if (userRow && userRow.role !== "admin" && userRow.role !== "vendor") {
      db.prepare(`UPDATE users SET role = 'vendor', session_version = COALESCE(session_version, 1) + 1 WHERE id = ?`).run(userId);
      await setSessionCookie(userId, "vendor", Number(userRow.session_version || 1) + 1);
    } else if (!session && userRow) {
      await setSessionCookie(userId, nextRole as "admin" | "vendor", Number(userRow.session_version || 1));
    }

    const savedVendor = db.prepare(`SELECT * FROM vendors WHERE id = ?`).get(vendorId);

    db.prepare(
      `INSERT INTO audit_logs (
         user_id, user_email, action, entity_type, entity_id, target_user_id, previous_status, new_status, details
       ) VALUES (?, ?, 'Seller Auto-Approved & Activated', 'vendor', ?, ?, ?, 'approved', ?)`
    ).run(
      userId,
      email,
      vendorId,
      userId,
      existingRejected ? "rejected" : "none",
      `Business: ${businessName} • Selling: ${effectiveBusinessTypes.join(", ")} • Categories: ${validCatSlugs.join(", ") || "Other"}`
    );

    await syncDbToS3();
    revalidatePath("/", "layout");

    // Send confirmation email via Nodemailer (best-effort)
    sendSellerApplicationEmail(email, ownerName, businessName, "approved").catch((e) =>
      console.error("Failed to send seller activation email:", e)
    );

    return NextResponse.json(
      {
        success: true,
        vendorId,
        status: "approved",
        vendor: savedVendor,
        message:
          "Your seller account is approved and active! You can now set prices and publish products for your selected categories.",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Seller registration error:", err);
    return NextResponse.json({ error: "Failed to submit seller application." }, { status: 500 });
  }
}
