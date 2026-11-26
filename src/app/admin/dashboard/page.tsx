import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/data";
import { syncDbFromS3 } from "@/lib/db";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Super Admin Dashboard | RAWMAT MART",
  description: "Centralized administration panel for RAWMAT MART marketplace management.",
};

export default async function AdminDashboardPage() {
  await syncDbFromS3(true);
  const session = await requireRole(["admin"]);
  if (!session) {
    redirect("/admin/login");
  }
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-[#0a2458] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-[#0a2458]">Loading Super Admin Control Center...</p>
        </div>
      }
    >
      <AdminDashboardClient />
    </Suspense>
  );
}
