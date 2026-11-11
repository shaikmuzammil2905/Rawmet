import type { Metadata } from "next";
import { getCmsMap } from "@/lib/data";
import { PromoteClient } from "@/components/PromoteClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promote Us • Grow With Us",
  description: "Partner with RAWMET.com, refer industrial vendors, and earn referral rewards.",
};

export default function PromotePage() {
  const { contactSettings } = getCmsMap();

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#f97316] to-[#ea580c] p-6 sm:p-8 text-white shadow-lg mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-100">
          RAWMET.com Partner Network
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold">Promote Us • Grow With Us</h1>
        <p className="mt-1 text-sm text-orange-50 max-w-2xl">
          Help manufacturers and suppliers join RAWMET.com and unlock admin-configured referral rewards when referred vendors subscribe.
        </p>
      </div>

      <PromoteClient rewardRule={contactSettings.referralRewardRule} />
    </div>
  );
}

