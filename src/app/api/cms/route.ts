import { NextResponse } from "next/server";
import { getCategories, getCmsMap, getGalleryItems, getSubscriptionPlans } from "@/lib/data";
import { syncDbFromS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await syncDbFromS3(true);
  ensureSeeded();
  const cms = getCmsMap();
  const plans = getSubscriptionPlans();
  const gallery = getGalleryItems();
  const categories = getCategories();

  return NextResponse.json(
    {
      ...cms,
      plans,
      gallery,
      categories,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}

