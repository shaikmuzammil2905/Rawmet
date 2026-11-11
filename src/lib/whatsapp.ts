import { getDb } from "./db";
import type { RequirementRecord } from "./types";

export interface WhatsAppDispatchResult {
  matchedVendors: number;
  dispatches: Array<{
    vendorId: number;
    vendorName: string;
    whatsapp: string;
    messagePreview: string;
    waLink: string;
  }>;
}

/**
 * Finds approved vendors who opted into WhatsApp notifications and match the requirement's
 * category slug (or product_service_category), records notifications in DB, and returns
 * formatted WhatsApp dispatch payloads.
 */
export function dispatchWhatsAppOpportunity(requirement: RequirementRecord): WhatsAppDispatchResult {
  const db = getDb();
  const vendors = db
    .prepare(
      `SELECT id, business_name, whatsapp, product_service_category, whatsapp_opt_in, whatsapp_categories
       FROM vendors
       WHERE verification_status = 'approved' AND whatsapp_opt_in = 1`
    )
    .all() as Array<{
    id: number;
    business_name: string;
    whatsapp: string;
    product_service_category: string;
    whatsapp_opt_in: number;
    whatsapp_categories: string;
  }>;

  const targetSlug = requirement.category_slug.toLowerCase();
  const matched = vendors.filter((v) => {
    let cats: string[] = [];
    try {
      cats = JSON.parse(v.whatsapp_categories || "[]");
    } catch {
      cats = [];
    }
    const normalizedCats = cats.map((c) => c.toLowerCase());
    const mainCat = (v.product_service_category || "").toLowerCase();
    return (
      normalizedCats.includes(targetSlug) ||
      normalizedCats.includes("all") ||
      mainCat.includes(targetSlug.replace(/-/g, " ")) ||
      mainCat === targetSlug
    );
  });

  const insertStmt = db.prepare(`
    INSERT INTO whatsapp_notifications (requirement_id, vendor_id, vendor_name, vendor_whatsapp, category_slug, message_preview, status)
    VALUES (?, ?, ?, ?, ?, ?, 'sent')
  `);

  const dispatches: WhatsAppDispatchResult["dispatches"] = [];
  for (const vendor of matched) {
    const cleanPhone = vendor.whatsapp.replace(/[^0-9]/g, "");
    const phoneWithCc = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const messagePreview = `New Business Opportunity Available on RAWMET.com!\n\nCategory: ${requirement.category_slug.toUpperCase()}\nRequirement: ${requirement.title}\nQuantity: ${requirement.quantity || "As specified"}\nLocation: ${requirement.location || "Pan India"}\nCustomer: ${requirement.business_name || requirement.name}\n\nLog in to your Vendor Dashboard or contact customer directly via RAWMET Real-Time Portal.`;
    insertStmt.run(
      requirement.id,
      vendor.id,
      vendor.business_name,
      vendor.whatsapp,
      requirement.category_slug,
      messagePreview
    );
    dispatches.push({
      vendorId: vendor.id,
      vendorName: vendor.business_name,
      whatsapp: vendor.whatsapp,
      messagePreview,
      waLink: `https://wa.me/${phoneWithCc}?text=${encodeURIComponent(messagePreview)}`,
    });
  }

  db.prepare(`UPDATE requirements SET matched_vendors_count = ?, status = ? WHERE id = ?`).run(
    matched.length,
    matched.length > 0 ? "matched" : "open",
    requirement.id
  );

  return {
    matchedVendors: matched.length,
    dispatches,
  };
}

