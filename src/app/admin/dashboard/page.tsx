import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/data";
import { AdminDashboardClient } from "@/components/AdminDashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Super Admin Dashboard | RAWMAT MART",
  description: "Centralized administration panel for RAWMAT MART marketplace management.",
};

export default async function AdminDashboardPage() {
  const session = await requireRole(["admin"]);
  if (!session) {
    redirect("/admin/login");
  }
  return <AdminDashboardClient />;
}
