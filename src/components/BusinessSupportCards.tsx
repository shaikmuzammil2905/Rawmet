"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Landmark,
  MessageCircle,
  Phone,
  Scale,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useToast } from "./ToastProvider";

export interface SupportServiceItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  conditions: string;
}

const SERVICE_POPUP_DETAILS: Record<
  string,
  {
    highlights: string[];
    eligibility: string;
    icon: "scale" | "file" | "landmark";
  }
> = {
  "ca-advice": {
    icon: "scale",
    eligibility: "Available for active RAWMET.com paid subscription holders (6M, 12M, 2Y & 3Y+1Y Plans).",
    highlights: [
      "Scheduled telephonic consultation with experienced Chartered Accountants",
      "Working capital optimization & MSME credit readiness guidance",
      "GST compliance review & tax structuring recommendations",
      "Guidance on industrial expansion & statutory audit preparation",
    ],
  },
  "gst-filing": {
    icon: "file",
    eligibility: "Business GST monthly return filing support coordinated through empaneled professionals.",
    highlights: [
      "GSTR-1 & GSTR-3B monthly filing coordination & reconciliation",
      "Input Tax Credit (ITC) mismatch review with vendor invoices",
      "HSN/SAC summary validation for industrial raw materials & machineries",
      "Timely deadline reminders so you avoid late fees or penalties",
    ],
  },
  "it-filing": {
    icon: "landmark",
    eligibility: "Annual Income Tax Return filing assistance for eligible paid subscribers.",
    highlights: [
      "Annual ITR preparation for Proprietorships, Partnerships & MSMEs",
      "Profit & Loss / Balance Sheet coordination & tax computation review",
      "26AS / AIS / TIS reconciliation before submission",
      "Dedicated compliance desk follow-up via phone & WhatsApp",
    ],
  },
};

export function BusinessSupportCards({
  items,
  mobile,
  whatsapp,
}: {
  items: SupportServiceItem[];
  mobile: string;
  whatsapp: string;
}) {
  const { showToast } = useToast();
  const [activeItem, setActiveItem] = useState<SupportServiceItem | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveItem(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function openPopup(item: SupportServiceItem) {
    setActiveItem(item);
    setSent(false);
    setNotes(`Interested in ${item.title} for my business.`);
  }

  async function handleCallbackRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!activeItem) return;
    setSending(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobile: phone,
          businessName: activeItem.title,
          message: `[Business Support Request: ${activeItem.title}] ${notes}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Unable to submit request.", "error");
        return;
      }
      setSent(true);
      showToast("Support callback request submitted! Customer Care will contact you shortly.", "success");
    } finally {
      setSending(false);
    }
  }

  const cleanWa = whatsapp.replace(/\D/g, "") || "917382177653";

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {items.map((item) => {
          const meta = SERVICE_POPUP_DETAILS[item.id] || SERVICE_POPUP_DETAILS["ca-advice"];
          const Icon =
            meta.icon === "scale" ? Scale : meta.icon === "file" ? FileText : Landmark;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => openPopup(item)}
              className="group text-left rounded-2xl bg-white border border-blue-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#f97316]/60 transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-block rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 px-2.5 py-0.5 text-[11px] font-bold">
                    {item.badge}
                  </span>
                  <span className="h-9 w-9 rounded-xl bg-blue-50 text-[#0a2458] group-hover:bg-[#f97316] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-extrabold text-[#0a2458] group-hover:text-[#1652b8] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs font-semibold text-[#1652b8] mt-0.5">{item.subtitle}</p>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs w-full">
                <span className="font-bold text-slate-500">{item.conditions}</span>
                <span className="inline-flex items-center gap-1 font-extrabold text-[#f97316] group-hover:translate-x-0.5 transition-transform">
                  View Details
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Support Popup Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="support-modal-title"
          className="fixed inset-0 z-[95] bg-[#06183d]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="relative max-w-2xl w-full rounded-3xl bg-white shadow-2xl border border-blue-100 overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0a2458] via-[#123983] to-[#0a2458] p-6 text-white flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316] px-3 py-0.5 text-[11px] font-bold uppercase">
                  <Sparkles className="h-3 w-3" />
                  {activeItem.badge}
                </span>
                <h3 id="support-modal-title" className="mt-2 text-xl sm:text-2xl font-extrabold">
                  {activeItem.title}
                </h3>
                <p className="text-xs sm:text-sm text-blue-100 mt-0.5">{activeItem.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                aria-label="Close popup"
                className="rounded-full bg-white/15 hover:bg-white/25 p-2 text-white transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-700 leading-relaxed">{activeItem.description}</p>

              <div className="rounded-2xl bg-[#f4f8ff] border border-blue-100 p-4 space-y-2.5">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#0a2458]">
                  What Is Included
                </p>
                <ul className="space-y-2 text-sm text-slate-700">
                  {(SERVICE_POPUP_DETAILS[activeItem.id]?.highlights || []).map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
                <p className="pt-2 text-xs font-bold text-[#ea580c] border-t border-blue-100">
                  {SERVICE_POPUP_DETAILS[activeItem.id]?.eligibility} • {activeItem.conditions}
                </p>
              </div>

              {/* Quick Request Callback Form */}
              {sent ? (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3 text-sm text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Callback Request Received!</p>
                    <p className="text-xs mt-0.5">
                      Our Customer Care team ({mobile}) will reach out with plan eligibility &amp; scheduling details.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCallbackRequest} className="space-y-3 border-t border-slate-100 pt-4">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#0a2458]">
                    Request Instant Callback for {activeItem.title}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Full Name *"
                      className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-[#1652b8] focus:outline-none"
                    />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-Digit Mobile *"
                      className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-[#1652b8] focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Business / Query Details"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-[#1652b8] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white py-2.5 px-5 text-sm font-bold shadow"
                  >
                    <Send className="h-4 w-4" />
                    <span>{sending ? "Submitting..." : "Request Support Callback"}</span>
                  </button>
                </form>
              )}

              {/* Quick Direct Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`tel:${mobile.replace(/\s+/g, "")}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-[#0a2458] hover:bg-slate-50"
                  >
                    <Phone className="h-3.5 w-3.5 text-[#f97316]" />
                    Call {mobile}
                  </a>
                  <a
                    href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(
                      `Hello RAWMET Customer Care, I want details about "${activeItem.title}" (Conditions Apply).`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp Care
                  </a>
                </div>
                <Link
                  href="/subscriptions"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-4 py-2 text-xs font-bold"
                >
                  <span>View Paid Plans</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

