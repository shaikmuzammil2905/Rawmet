import { Suspense } from "react";
import type { Metadata } from "next";
import { UnifiedSellerPageClient } from "@/components/UnifiedSellerPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seller Portal & Dashboard | RAWMAT MART",
  description: "Manage your products, quotations, enquiries and live catalog.",
};

export default function VendorDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 border-4 border-[#0a2458] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-[#0a2458]">Loading Seller Portal...</p>
        </div>
      }
    >
      <UnifiedSellerPageClient />
    </Suspense>
  );
}
