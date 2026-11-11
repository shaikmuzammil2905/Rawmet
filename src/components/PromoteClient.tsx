"use client";

import React, { useState } from "react";
import { CheckCircle2, Gift, MessageCircle, Send } from "lucide-react";
import { useToast } from "./ToastProvider";

export function PromoteClient({ rewardRule }: { rewardRule: string }) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [referenceDetails, setReferenceDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    referralCode: string;
    whatsappUrl: string;
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile, whatsapp, location, referenceDetails }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Submission failed.", "error");
        return;
      }
      setResult(data);
      showToast("Referral partner registration submitted!", "success");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 space-y-5">
        <div className="rounded-3xl bg-gradient-to-br from-[#0a2458] to-[#06183d] p-7 text-white shadow-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316] px-3 py-1 text-xs font-bold">
            <Gift className="h-3.5 w-3.5" />
            Partner Referral Program
          </span>
          <h2 className="mt-3 text-2xl font-extrabold">How Promote Us • Grow With Us Works</h2>
          <p className="mt-2 text-sm text-blue-100 leading-relaxed">{rewardRule}</p>

          <ul className="mt-5 space-y-3 text-sm">
            {[
              "Submit your partner profile and referred vendor/buyer details.",
              "Receive your unique RAWMET Partner Referral Code immediately.",
              "Connect with our partner desk on WhatsApp in one click.",
              "When a referred vendor purchases a paid subscription, eligible rewards/discounts apply per admin-configured rules.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="h-6 w-6 rounded-full bg-orange-500 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-blue-50">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#0a2458]">Submit Partner / Referral Details</h2>
        <p className="text-sm text-slate-600 mt-1">
          Connected directly to our RAWMET partner workflow &amp; WhatsApp desk.
        </p>

        {result ? (
          <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-extrabold text-emerald-950">Registration Confirmed!</h3>
                <p className="text-sm text-emerald-800 mt-1">{result.message}</p>
              </div>
            </div>
            <div className="rounded-xl bg-white border border-emerald-200 p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Your Referral Code</span>
              <span className="text-lg font-extrabold text-[#0a2458] tracking-wider">{result.referralCode}</span>
            </div>
            <a
              href={result.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 text-sm font-bold shadow"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Send Details via WhatsApp Now</span>
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="10-digit WhatsApp"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City / Location *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pune, Hyderabad, Ahmedabad"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reference Details (Referred Vendor / Business / Industrial Network) *
              </label>
              <textarea
                rows={4}
                required
                value={referenceDetails}
                onChange={(e) => setReferenceDetails(e.target.value)}
                placeholder="Share the vendor business name, contact person, or industrial sector you are referring..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white py-3 px-6 text-sm font-bold shadow transition-all"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? "Submitting..." : "Join Promote Us • Grow With Us"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

