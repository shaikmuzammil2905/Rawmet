import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Panel | RAWMAT MART",
};

export default async function AdminPage() {
  const session = await requireRole(["admin"]);
  if (!session) {
    redirect("/admin/login");
  }
  redirect("/admin/dashboard");
}
