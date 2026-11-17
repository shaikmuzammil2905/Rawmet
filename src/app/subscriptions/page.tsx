import type { Metadata } from "next";
import { Sparkles, Tag } from "lucide-react";
import { getCmsMap, getSubscriptionPlans } from "@/lib/data";
import { BusinessSupportCards } from "@/components/BusinessSupportCards";
import { SubscriptionPlansGrid } from "@/components/SubscriptionPlansGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subscription Plans & Launching Offer | RAWMAT MART",
  description:
    "Subscribe to RAWMAT MART Industrial Portal. Free Plan ₹0, 3-Months ₹500, 6-Months ₹600, Subscription Form ₹1,500, and Annual & Launching Offer Plans.",
};

export default function SubscriptionsPage() {
  const plans = getSubscriptionPlans();
  const { launchingOffer, businessSupport, contactSettings } = getCmsMap();

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 space-y-10">
      {/* Launch Offer Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0a2458] via-[#123983] to-[#06183d] p-7 sm:p-10 text-white shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider">
            <Tag className="h-3.5 w-3.5" />
            {launchingOffer.badge}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold">{launchingOffer.subtitle}</h1>
          <p className="text-sm sm:text-base text-orange-300 font-bold">
            <Sparkles className="inline h-4 w-4 mr-1" />
            {launchingOffer.fourthYearFreeNote}
          </p>
          <p className="text-sm text-blue-100">
            All paid subscription packages include 18% GST with computer-generated GST tax invoices issued instantly upon payment.
          </p>
        </div>
        <div className="h-36 w-36 rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0">
          <img src="/images/offer-gift.png" alt="Launching Offer" className="h-full w-full object-cover" />
        </div>
      </section>

      {/* Plans Grid */}
      <section>
        <SubscriptionPlansGrid plans={plans} />
      </section>

      {/* Paid Business Support Conditions */}
      <section className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8">
        <h2 className="text-xl font-extrabold text-[#0a2458]">
          Included Business Support Services (*Conditions Apply)
        </h2>
        <p className="text-sm text-slate-600 mt-1 mb-5">{contactSettings.conditionsApplyNote}</p>
        <BusinessSupportCards
          items={businessSupport}
          mobile={contactSettings.mobile}
          whatsapp={contactSettings.whatsapp}
        />
      </section>
    </div>
  );
}
