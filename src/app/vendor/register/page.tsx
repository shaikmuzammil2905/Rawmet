import { Suspense } from "react";
import type { Metadata } from "next";
import { VendorRegisterClient } from "@/components/VendorRegisterClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seller Business Registration | RAWMAT MART",
  description: "Register as a verified seller on RAWMAT MART industrial marketplace.",
};

export default function VendorRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="h-9 w-9 border-4 border-[#0a2458] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-[#0a2458]">Loading Seller Registration...</p>
        </div>
      }
    >
      <VendorRegisterClient />
    </Suspense>
  );
}
