import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb, syncDbFromS3, syncDbToS3 } from "@/lib/db";
import { requireRole } from "@/lib/data";
import { dispatchWhatsAppOpportunity } from "@/lib/whatsapp";
import type { RequirementRecord } from "@/lib/types";

export async function PATCH(req: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const body = (await req.json()) as {
    action?: string;
    id?: number;
    status?: string;
    rewardNote?: string;
    name?: string;
    businessName?: string;
    mobile?: string;
    whatsapp?: string;
    email?: string;
    categoryType?: "product" | "machinery" | "service";
    categorySlug?: string;
    title?: string;
    quantity?: string;
    location?: string;
    description?: string;
  };

  try {
    await syncDbFromS3(true);
    const db = getDb();

    if (body.action === "user_status" && body.id && body.status) {
      db.prepare(`UPDATE users SET status = ? WHERE id = ? AND role != 'admin'`).run(body.status, body.id);
      await syncDbToS3();
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true });
    }

    if (body.action === "requirement_create") {
      const name = (body.name || "RAWMAT MART Admin").trim();
      const mobile = (body.mobile || "7382177653").replace(/\D/g, "").slice(-10) || "7382177653";
      const whatsapp = (body.whatsapp || mobile).replace(/\D/g, "") || `91${mobile}`;
      const title = (body.title || "").trim();
      const categorySlug = (body.categorySlug || "rubber").trim();
      if (!title) {
        return NextResponse.json({ error: "Requirement title is required." }, { status: 400 });
      }
      const res = db
        .prepare(
          `INSERT INTO requirements (
            user_id, name, business_name, mobile, whatsapp, email,
            category_type, category_slug, title, quantity, location,
            description, attachment_url, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 'open')`
        )
        .run(
          session.user.id,
          name,
          (body.businessName || "RAWMAT MART Desk").trim(),
          mobile,
          whatsapp,
          (body.email || "").trim(),
          body.categoryType || "product",
          categorySlug,
          title,
          (body.quantity || "").trim(),
          (body.location || "Pan India").trim(),
          (body.description || "").trim()
        );
      await syncDbToS3();
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true, id: Number(res.lastInsertRowid) }, { status: 201 });
    }

    if (body.action === "requirement_delete" && body.id) {
      db.prepare(`DELETE FROM requirements WHERE id = ?`).run(body.id);
      await syncDbToS3();
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true });
    }

    if (body.action === "requirement_status" && body.id && body.status) {
      db.prepare(`UPDATE requirements SET status = ? WHERE id = ?`).run(body.status, body.id);
      await syncDbToS3();
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true });
    }

    if (body.action === "requirement_dispatch_whatsapp" && body.id) {
      const reqRow = db.prepare(`SELECT * FROM requirements WHERE id = ?`).get(body.id) as
        | RequirementRecord
        | undefined;
      if (!reqRow) return NextResponse.json({ error: "Requirement not found." }, { status: 404 });
      const result = dispatchWhatsAppOpportunity(reqRow);
      await syncDbToS3();
      return NextResponse.json({ success: true, ...result });
    }

    if (body.action === "enquiry_status" && body.id && body.status) {
      db.prepare(`UPDATE enquiries SET status = ? WHERE id = ?`).run(body.status, body.id);
      await syncDbToS3();
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true });
    }

    if (body.action === "referral_update" && body.id) {
      db.prepare(`UPDATE referrals SET status = COALESCE(?, status), reward_note = COALESCE(?, reward_note) WHERE id = ?`).run(
        body.status ?? null,
        body.rewardNote ?? null,
        body.id
      );
      await syncDbToS3();
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to execute action.";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

