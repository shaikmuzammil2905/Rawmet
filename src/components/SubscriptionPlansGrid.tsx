"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardList, HelpCircle } from "lucide-react";
import type { SubscriptionPlanRecord } from "@/lib/types";
import { SubscriptionFormModal } from "./SubscriptionFormModal";

interface SubscriptionPlansGridProps {
  plans: SubscriptionPlanRecord[];
}

export function SubscriptionPlansGrid({ plans }: SubscriptionPlansGridProps) {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; amount: number }>({
    name: "Subscription Form (₹1,500)",
    amount: 1500,
  });

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isLaunch = plan.bonus_months > 0;
          const isFree = plan.price_inr === 0;
          const isCustomForm = plan.slug === "subscription-form-plan" || plan.price_inr === 1500;

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
                  : isCustomForm
                  ? "bg-amber-50/50 border-2 border-amber-300 shadow-md hover:shadow-xl"
                  : "bg-white border border-slate-200 shadow-sm hover:shadow-xl"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${
                      isLaunch
                        ? "bg-[#f97316] text-white"
                        : isCustomForm
                        ? "bg-amber-600 text-white"
                        : isFree
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-blue-50 text-[#1652b8]"
                    }`}
                  >
                    {plan.badge_text || (isFree ? "Free Plan" : "Plan")}
                  </span>
                  {plan.listing_allowance ? (
                    <span className="text-[11px] font-bold text-slate-500">
                      {plan.listing_allowance > 1000 ? "Unlimited" : `${plan.listing_allowance} Listings`}
                    </span>
                  ) : null}
                </div>

                <h2 className={`mt-4 text-xl font-extrabold ${isLaunch ? "text-white" : "text-[#0a2458]"}`}>
                  {plan.name}
                </h2>
                <p className={`text-xs mt-1 ${isLaunch ? "text-blue-200" : "text-slate-500"}`}>
                  {plan.highlight_text}
                </p>

                <div className="mt-4 pb-4 border-b border-current/10">
                  <div className={`text-3xl font-extrabold ${isLaunch ? "text-white" : "text-[#0a2458]"}`}>
                    {isFree ? "₹0 Free" : `₹${plan.price_inr.toLocaleString("en-IN")}`}
                  </div>
                  <p className={`text-xs mt-1 ${isLaunch ? "text-orange-300" : isCustomForm ? "text-amber-800 font-medium" : "text-slate-500"}`}>
                    {isFree
                      ? "100% Free Forever for registered vendors"
                      : isCustomForm
                      ? "*Pending client confirmation of exact validity and benefits"
                      : `Including 18% GST (₹${gstAmount.toLocaleString("en-IN")} GST included)`}
                  </p>
                </div>

                <ul className="mt-4 space-y-2.5 text-sm">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                          isLaunch ? "text-orange-400" : isCustomForm ? "text-amber-600" : "text-emerald-600"
                        }`}
                      />
                      <span className={isLaunch ? "text-blue-50" : "text-slate-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {isFree ? (
                <Link
                  href="/register"
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full py-3 px-5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition-all"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : isCustomForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan({ name: plan.name, amount: plan.price_inr });
                    setFormModalOpen(true);
                  }}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full py-3 px-5 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition-all"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>Submit Subscription Form</span>
                </button>
              ) : (
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
              )}
            </div>
          );
        })}
      </div>

      <SubscriptionFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        defaultPlanName={selectedPlan.name}
        defaultAmount={selectedPlan.amount}
      />
    </>
  );
}
