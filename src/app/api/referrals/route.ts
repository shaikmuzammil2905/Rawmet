import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCmsMap } from "@/lib/data";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      mobile?: string;
      whatsapp?: string;
      location?: string;
      referenceDetails?: string;
    };

    const name = (body.name || "").trim();
    const mobile = (body.mobile || "").replace(/\D/g, "").slice(-10);
    const whatsapp = (body.whatsapp || mobile).replace(/\D/g, "");
    const location = (body.location || "").trim();
    const referenceDetails = (body.referenceDetails || "").trim();

    if (!name || mobile.length !== 10 || !location || !referenceDetails) {
      return NextResponse.json(
        { error: "Name, 10-digit mobile, location, and reference details are required." },
        { status: 400 }
      );
    }

    const referralCode = `RAW-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const db = getDb();
    db.prepare(
      `INSERT INTO referrals (name, mobile, whatsapp, location, reference_details, referral_code, status)
       VALUES (?, ?, ?, ?, ?, ?, 'new')`
    ).run(name, mobile, whatsapp || `91${mobile}`, location, referenceDetails, referralCode);

    const { contactSettings } = getCmsMap();
    const adminWa = contactSettings.whatsapp.replace(/\D/g, "") || "917382177653";
    const waText = `Promote Us • Grow With Us Partner Submission\nName: ${name}\nMobile: ${mobile}\nLocation: ${location}\nReference Code: ${referralCode}\nDetails: ${referenceDetails}`;

    return NextResponse.json(
      {
        success: true,
        referralCode,
        rewardRule: contactSettings.referralRewardRule,
        whatsappUrl: `https://wa.me/${adminWa}?text=${encodeURIComponent(waText)}`,
        message: "Promotional partner registration received! Share your referral code to earn admin-configured rewards.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to submit referral form." }, { status: 500 });
  }
}

