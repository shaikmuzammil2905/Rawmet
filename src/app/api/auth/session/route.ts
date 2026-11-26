import { NextResponse } from "next/server";
import { syncDbFromS3 } from "@/lib/db";
import { getCurrentSession } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await syncDbFromS3(true);
  const session = await getCurrentSession();
  const headers = { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" };
  if (!session) {
    return NextResponse.json(
      { authenticated: false, user: null, vendor: null, activeSubscription: null },
      { headers }
    );
  }
  return NextResponse.json(
    {
      authenticated: true,
      user: session.user,
      vendor: session.vendor,
      activeSubscription: session.activeSubscription,
    },
    { headers }
  );
}

