"use client";

import React, { useState } from "react";
import { Bookmark, CheckCircle2, MessageCircle, Send } from "lucide-react";
import { useToast } from "./ToastProvider";

export function ListingDetailClient({
  listingId,
  vendorId,
  listingTitle,
  whatsappHref,
  galleryUrls,
}: {
  listingId: number;
  vendorId: number;
  listingTitle: string;
  whatsappHref: string;
  galleryUrls: string[];
}) {
  const { showToast } = useToast();
  const [activeImg, setActiveImg] = useState(galleryUrls[0] || "/images/cat-products.png");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(`Interested in ${listingTitle}. Please share technical specs and best quote.`);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleEnquiry(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          vendorId,
          name,
          businessName,
          mobile,
          email,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Unable to submit enquiry.", "error");
        return;
      }
      setSent(true);
      showToast(data.message || "Enquiry sent successfully!", "success");
    } catch {
      showToast("Network error while sending enquiry.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/saved-listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Login to save listings.", "info");
        return;
      }
      showToast("Listing saved to your dashboard!", "success");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Grand Gallery Viewer */}
      <div className="rounded-3xl bg-white border border-blue-100 p-4 shadow-lg">
        <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 shadow-inner">
          <img
            src={activeImg}
            alt={listingTitle}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
          />
        </div>
        {galleryUrls.length > 1 && (
          <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
            {galleryUrls.map((url, idx) => (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => setActiveImg(url)}
                className={`h-16 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                  activeImg === url ? "border-[#f97316]" : "border-transparent opacity-75 hover:opacity-100"
                }`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 text-sm font-bold shadow transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Contact on WhatsApp</span>
        </a>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#0a2458] px-5 py-3 text-sm font-bold shadow-sm transition-colors"
        >
          <Bookmark className="h-4 w-4 text-[#f97316]" />
          <span>{saving ? "Saving..." : "Save Listing"}</span>
        </button>
      </div>

      {/* Enquiry Form */}
      <div id="enquiry" className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-extrabold text-[#0a2458]">Send Direct Business Enquiry</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Your enquiry goes directly to the verified vendor&apos;s RAWMET dashboard.
        </p>

        {sent ? (
          <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold">Enquiry Delivered!</p>
              <p className="mt-1 text-emerald-800">
                The vendor has received your enquiry. You can also connect faster via WhatsApp above.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleEnquiry} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Full Name *"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Company / Business Name"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-Digit Mobile Number *"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Business Email"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
            </div>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white py-3 px-5 text-sm font-bold shadow transition-colors"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? "Sending Enquiry..." : "Submit Enquiry Now"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

