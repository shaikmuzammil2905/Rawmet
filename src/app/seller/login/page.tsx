import { Suspense } from "react";
import type { Metadata } from "next";
import { SellerLoginClient } from "@/components/SellerLoginClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seller Login | RAWMAT MART",
  description: "Sign in to your registered seller and vendor business account on RAWMAT MART.",
};

export default function SellerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <div className="h-9 w-9 border-4 border-[#0a2458] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#0a2458]">Loading Seller Portal...</p>
        </div>
      }
    >
      <SellerLoginClient />
    </Suspense>
  );
}
