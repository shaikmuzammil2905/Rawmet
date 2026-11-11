import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/data";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Panel",
};

export default async function AdminPage() {
  const session = await requireRole(["admin"]);
  if (!session) {
    redirect("/admin/login");
  }
  return <AdminDashboardClient />;
}

