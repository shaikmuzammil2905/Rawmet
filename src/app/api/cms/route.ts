import { NextResponse } from "next/server";
import { getCategories, getCmsMap, getGalleryItems, getSubscriptionPlans } from "@/lib/data";

export async function GET() {
  const cms = getCmsMap();
  const plans = getSubscriptionPlans();
  const gallery = getGalleryItems();
  const categories = getCategories();

  return NextResponse.json({
    ...cms,
    plans,
    gallery,
    categories,
  });
}

