import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isS3Configured } from "@/lib/s3";
import { isRazorpayConfigured } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let counts: Record<string, number> = {};

  try {
    const db = getDb();
    const usersCount = (db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number }).c;
    const listingsCount = (db.prepare("SELECT COUNT(*) as c FROM listings").get() as { c: number }).c;
    const vendorsCount = (db.prepare("SELECT COUNT(*) as c FROM vendors").get() as { c: number }).c;
    counts = {
      users: usersCount,
      vendors: vendorsCount,
      listings: listingsCount,
    };
  } catch (e) {
    dbStatus = `unhealthy: ${e instanceof Error ? e.message : "database error"}`;
  }

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: dbStatus === "healthy" ? "ok" : "degraded",
      service: "RAWMAT MART Backend Portal",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || "development",
      checks: {
        database: {
          status: dbStatus,
          responseTimeMs,
          records: counts,
        },
        awsS3: {
          configured: isS3Configured(),
          bucket: process.env.AWS_S3_BUCKET_NAME || "rawmat-mart-storage",
          region: process.env.AWS_REGION || "ap-southeast-2",
        },
        razorpay: {
          configured: isRazorpayConfigured(),
          keyId: (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").slice(0, 10) + "...",
        },
      },
    },
    { status: dbStatus === "healthy" ? 200 : 503 }
  );
}
