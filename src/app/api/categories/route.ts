import { NextResponse } from "next/server";
import { getCategories, getSubcategories } from "@/lib/data";
import { syncDbFromS3 } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await syncDbFromS3(true);
  ensureSeeded();

  return NextResponse.json(
    {
      categories: getCategories(),
      subcategories: getSubcategories(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
