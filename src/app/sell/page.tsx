import { Suspense } from "react";
import type { Metadata } from "next";
import { UnifiedSellerPageClient } from "@/components/UnifiedSellerPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sell on RAWMAT MART | Industrial Marketplace",
  description: "Start selling your industrial products, machinery and services on RAWMAT MART.",
};

export default function SellPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="h-9 w-9 border-4 border-[#0a2458] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#0a2458]">Loading Seller Portal...</p>
        </div>
      }
    >
      <UnifiedSellerPageClient />
    </Suspense>
  );
}
