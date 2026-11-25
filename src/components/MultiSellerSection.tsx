"use client";

import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Tag,
  X,
  FileText,
  BadgeCheck,
  Package,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

export interface SellerOfferItem {
  listing_id: number;
  price_display: string;
  price_numeric: number;
  price_unit: string;
  min_order_qty: string;
  availability: string;
  location: string;
  specifications: string;
  description: string;
  master_product_id: number | null;
  vendor_id: number;
  user_id: number;
  seller_name: string;
  business_name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  gst_number: string;
  vendor_city: string;
  vendor_state: string;
  verification_status: string;
  is_current?: number;
}

interface MultiSellerSectionProps {
  productTitle: string;
  productImage: string;
  categoryName: string;
  subcategoryName?: string;
  productDescription: string;
  sellers: SellerOfferItem[];
}

export function MultiSellerSection({
  productTitle,
  productImage,
  categoryName,
  subcategoryName,
  productDescription,
  sellers,
}: MultiSellerSectionProps) {
  const { showToast } = useToast();

  const [detailModalSeller, setDetailModalSeller] = useState<SellerOfferItem | null>(null);
  const [contactModalSeller, setContactModalSeller] = useState<SellerOfferItem | null>(null);

  // Contact / Enquiry form state
  const [buyerName, setBuyerName] = useState("");
  const [buyerMobile, setBuyerMobile] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerMessage, setBuyerMessage] = useState("");
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);

  async function handleSendEnquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!contactModalSeller) return;
    if (!buyerName || buyerMobile.length < 10) {
      showToast("Please enter your name and valid 10-digit mobile number.", "error");
      return;
    }

    setSubmittingEnquiry(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: contactModalSeller.listing_id,
          vendorId: contactModalSeller.vendor_id,
          name: buyerName,
          mobile: buyerMobile,
          email: buyerEmail,
          message: buyerMessage || `I am interested in "${productTitle}" offered at ${contactModalSeller.price_display}. Please provide a quotation and delivery details.`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to send enquiry.", "error");
        return;
      }

      showToast("Enquiry sent successfully to the seller! They will contact you shortly.", "success");
      setContactModalSeller(null);
      setBuyerMessage("");
    } catch {
      showToast("Unable to send enquiry. Please try again.", "error");
    } finally {
      setSubmittingEnquiry(false);
    }
  }

  if (!sellers || sellers.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#0a2458]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#f97316]" />
            Verified Marketplace Multi-Vendor Comparison
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a2458] mt-2">
            Available Sellers for This Product ({sellers.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare prices, minimum order quantities, and locations across verified Indian industrial suppliers.
          </p>
        </div>
      </div>

      {/* Sellers Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sellers.map((s, idx) => {
          let specsObj: Record<string, string> = {};
          try {
            specsObj = typeof s.specifications === "string" ? JSON.parse(s.specifications) : s.specifications || {};
          } catch {
            specsObj = {};
          }

          const cleanWa = (s.whatsapp || s.mobile || "917382177653").replace(/\D/g, "");
          const waLink = `https://wa.me/${cleanWa.length === 10 ? `91${cleanWa}` : cleanWa}?text=${encodeURIComponent(
            `Hello ${s.business_name}, I saw your offer for "${productTitle}" at ${s.price_display} on RAWMAT MART and would like to place an enquiry.`
          )}`;

          return (
            <div
              key={s.listing_id || idx}
              className="rounded-2xl border border-slate-200 bg-white hover:border-[#1652b8] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Seller Business Info */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-extrabold text-[#0a2458] text-base leading-snug">
                      {s.business_name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Contact: <strong>{s.seller_name}</strong>
                    </p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[11px] font-bold">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    GST Verified
                  </span>
                </div>

                {/* Price Display */}
                <div className="my-3 rounded-xl bg-orange-50/70 border border-orange-200/60 p-3">
                  <div className="text-[11px] font-bold text-orange-800 uppercase tracking-wide">
                    Offered Price
                  </div>
                  <div className="text-2xl font-black text-[#f97316] mt-0.5">
                    {s.price_display || (s.price_numeric > 0 ? `₹${s.price_numeric} / ${s.price_unit || "Unit"}` : "Request Quote")}
                  </div>
                </div>

                {/* Specs / Meta */}
                <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#1652b8]" />
                      {s.location || s.vendor_city || "Pan India"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Min Order Qty (MOQ):</span>
                    <span className="font-semibold text-slate-700">{s.min_order_qty || "1 Unit"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Stock Availability:</span>
                    <span className="font-semibold text-emerald-600">{s.availability || "In Stock"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: VIEW DETAILS & CONTACT SELLER */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setDetailModalSeller(s)}
                  className="rounded-full border border-[#0a2458] text-[#0a2458] hover:bg-blue-50 py-2.5 px-3 text-xs font-bold transition-all text-center"
                >
                  VIEW DETAILS
                </button>
                <button
                  type="button"
                  onClick={() => setContactModalSeller(s)}
                  className="rounded-full bg-[#0a2458] hover:bg-[#1652b8] text-white py-2.5 px-3 text-xs font-bold transition-all text-center shadow-xs"
                >
                  CONTACT SELLER
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1. VIEW DETAILS MODAL */}
      {detailModalSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
          <div className="rounded-3xl bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setDetailModalSeller(null)}
              className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header with Admin Master Image & Product Info */}
            <div className="flex flex-col sm:flex-row gap-5 items-start pb-5 border-b border-slate-200">
              <img
                src={productImage || "/images/cat-products.png"}
                alt={productTitle}
                className="h-28 w-28 rounded-2xl object-cover border border-slate-200 bg-slate-50 shrink-0"
              />
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-[#0a2458] px-2.5 py-0.5 text-xs font-bold uppercase">
                  {categoryName} {subcategoryName ? `• ${subcategoryName}` : ""}
                </span>
                <h3 className="text-xl font-black text-[#0a2458] mt-1.5 leading-snug">
                  {productTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {productDescription}
                </p>
              </div>
            </div>

            {/* Specific Seller Offering Details */}
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Selected Supplier</span>
                    <h4 className="text-lg font-black text-[#0a2458]">{detailModalSeller.business_name}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Proprietor / Representative: <strong>{detailModalSeller.seller_name}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-orange-800 uppercase">Selling Price</span>
                    <div className="text-2xl font-black text-[#f97316]">
                      {detailModalSeller.price_display || `₹${detailModalSeller.price_numeric} / ${detailModalSeller.price_unit}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Commercial Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <span className="text-slate-400 block mb-0.5">Supply Location</span>
                  <strong className="text-slate-800 text-sm">
                    {detailModalSeller.location || detailModalSeller.vendor_city || "Pan India"}
                  </strong>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <span className="text-slate-400 block mb-0.5">Min Order Qty</span>
                  <strong className="text-slate-800 text-sm">{detailModalSeller.min_order_qty || "1 Unit"}</strong>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <span className="text-slate-400 block mb-0.5">Availability</span>
                  <strong className="text-emerald-700 text-sm">{detailModalSeller.availability || "In Stock"}</strong>
                </div>
              </div>

              {/* Seller Description */}
              {detailModalSeller.description && (
                <div className="rounded-xl border border-slate-200 p-3.5 bg-white text-xs">
                  <span className="font-bold text-slate-700 block mb-1">Seller Notes & Terms:</span>
                  <p className="text-slate-600 leading-relaxed">{detailModalSeller.description}</p>
                </div>
              )}

              {/* Specifications */}
              {detailModalSeller.specifications && (
                <div className="rounded-xl border border-slate-200 p-3.5 bg-white text-xs">
                  <span className="font-bold text-slate-700 block mb-2">Technical Specifications:</span>
                  <div className="space-y-1.5 text-slate-600 font-mono">
                    {detailModalSeller.specifications}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDetailModalSeller(null)}
                className="rounded-full px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = detailModalSeller;
                  setDetailModalSeller(null);
                  setContactModalSeller(s);
                }}
                className="rounded-full bg-[#0a2458] hover:bg-[#1652b8] text-white px-6 py-2.5 text-xs font-extrabold shadow-sm"
              >
                CONTACT THIS SELLER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONTACT SELLER MODAL */}
      {contactModalSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
          <div className="rounded-3xl bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setContactModalSeller(null)}
              className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full">
                <Building2 className="h-3.5 w-3.5" />
                Contact Seller
              </span>
              <h3 className="text-xl font-extrabold text-[#0a2458] mt-2">
                {contactModalSeller.business_name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Representative: {contactModalSeller.seller_name} • GST: {contactModalSeller.gst_number || "Verified"}
              </p>
            </div>

            {/* Direct Connect Options: WhatsApp & Phone */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(() => {
                const cleanWa = (contactModalSeller.whatsapp || contactModalSeller.mobile || "917382177653").replace(/\D/g, "");
                const waHref = `https://wa.me/${cleanWa.length === 10 ? `91${cleanWa}` : cleanWa}?text=${encodeURIComponent(
                  `Hello ${contactModalSeller.business_name}, I saw "${productTitle}" offered at ${contactModalSeller.price_display} on RAWMAT MART and would like to place an order/quotation enquiry.`
                )}`;
                return (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-3 text-xs font-bold shadow-xs transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>WhatsApp Chat</span>
                  </a>
                );
              })()}

              <a
                href={`tel:${contactModalSeller.mobile || "+917382177653"}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#0a2458] hover:bg-[#1652b8] text-white py-3 px-3 text-xs font-bold shadow-xs transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>Call Now</span>
              </a>
            </div>

            {/* Send Verified Enquiry Form */}
            <form onSubmit={handleSendEnquiry} className="space-y-3.5 border-t border-slate-100 pt-5">
              <p className="text-xs font-bold text-slate-700">Or Send a Direct Trade Enquiry:</p>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g. Shaik Muzammil"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:border-[#0a2458] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile Number (10 digits) *</label>
                  <input
                    type="tel"
                    required
                    value={buyerMobile}
                    onChange={(e) => setBuyerMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9820112233"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:border-[#0a2458] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Business Email (Optional)</label>
                  <input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="buyer@company.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs focus:border-[#0a2458] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Requirement / Message</label>
                <textarea
                  rows={3}
                  value={buyerMessage}
                  onChange={(e) => setBuyerMessage(e.target.value)}
                  placeholder={`Please quote for "${productTitle}" with delivery to my location.`}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs focus:border-[#0a2458] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submittingEnquiry}
                className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white py-3 text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {submittingEnquiry ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit Enquiry to Seller</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
