import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/data";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null, vendor: null, activeSubscription: null });
  }
  return NextResponse.json({
    authenticated: true,
    user: session.user,
    vendor: session.vendor,
    activeSubscription: session.activeSubscription,
  });
}

