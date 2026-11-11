import type { Metadata } from "next";
import { CustomerDashboardClient } from "@/components/CustomerDashboardClient";

export const metadata: Metadata = {
  title: "Customer Dashboard",
};

export default function DashboardPage() {
  return <CustomerDashboardClient />;
}

