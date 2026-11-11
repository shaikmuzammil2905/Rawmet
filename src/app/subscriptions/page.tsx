import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Tag } from "lucide-react";
import { getCmsMap, getSubscriptionPlans } from "@/lib/data";
import { BusinessSupportCards } from "@/components/BusinessSupportCards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subscription Plans & Launching Offer",
  description:
    "Subscribe to RAWMET.com Business Portal. 6 Months ₹6,000, 12 Months ₹11,000, 2 Years ₹20,000, and 3 Years ₹35,000 + 4th Year FREE Launch Offer (Incl. 18% GST).",
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
            All subscription prices are inclusive of 18% GST with official GST Tax Invoice issued immediately after payment verification.
          </p>
        </div>
        <div className="h-36 w-36 rounded-2xl overflow-hidden shadow-2xl border border-white/20 shrink-0">
          <img src="/images/offer-gift.png" alt="Launching Offer" className="h-full w-full object-cover" />
        </div>
      </section>

      {/* Plans Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isLaunch = plan.bonus_months > 0;
          let features: string[] = [];
          try {
            features = JSON.parse(plan.features || "[]");
          } catch {
            features = [];
          }
          const gstAmount = Math.round(plan.price_inr - plan.price_inr / 1.18);

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 flex flex-col justify-between transition-all ${
                isLaunch
                  ? "bg-gradient-to-b from-[#0a2458] to-[#06183d] text-white border-2 border-[#f97316] shadow-2xl"
                  : "bg-white border border-slate-200 shadow-sm hover:shadow-xl"
              }`}
            >
              <div>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${
                    isLaunch ? "bg-[#f97316] text-white" : "bg-blue-50 text-[#1652b8]"
                  }`}
                >
                  {plan.badge_text}
                </span>

                <h2 className={`mt-4 text-xl font-extrabold ${isLaunch ? "text-white" : "text-[#0a2458]"}`}>
                  {plan.name}
                </h2>
                <p className={`text-xs mt-1 ${isLaunch ? "text-blue-200" : "text-slate-500"}`}>
                  {plan.highlight_text}
                </p>

                <div className="mt-4 pb-4 border-b border-current/10">
                  <div className={`text-3xl font-extrabold ${isLaunch ? "text-white" : "text-[#0a2458]"}`}>
                    ₹{plan.price_inr.toLocaleString("en-IN")}
                  </div>
                  <p className={`text-xs mt-1 ${isLaunch ? "text-orange-300" : "text-slate-500"}`}>
                    Including 18% GST (₹{gstAmount.toLocaleString("en-IN")} GST included)
                  </p>
                </div>

                <ul className="mt-4 space-y-2.5 text-sm">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                          isLaunch ? "text-orange-400" : "text-emerald-600"
                        }`}
                      />
                      <span className={isLaunch ? "text-blue-50" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={`/checkout?planId=${plan.id}`}
                className={`mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full py-3 px-5 text-sm font-bold shadow transition-all ${
                  isLaunch
                    ? "bg-[#f97316] hover:bg-[#ea580c] text-white"
                    : "bg-[#0a2458] hover:bg-[#06183d] text-white"
                }`}
              >
                <span>Subscribe Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
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

