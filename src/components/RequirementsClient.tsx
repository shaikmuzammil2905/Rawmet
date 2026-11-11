"use client";

import React, { useState } from "react";
import { CheckCircle2, FileUp, MapPin, MessageCircle, Search, Send, Sparkles } from "lucide-react";
import type { CategoryRecord, RequirementRecord } from "@/lib/types";
import { useToast } from "./ToastProvider";

export function RequirementsClient({
  initialRequirements,
  categories,
}: {
  initialRequirements: RequirementRecord[];
  categories: CategoryRecord[];
}) {
  const { showToast } = useToast();
  const [items, setItems] = useState<RequirementRecord[]>(initialRequirements);
  const [filterCat, setFilterCat] = useState("all");
  const [q, setQ] = useState("");
  const [loadingList, setLoadingList] = useState(false);

  // Post requirement form
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [mobile, setMobile] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [categoryType, setCategoryType] = useState<"product" | "machinery" | "service">("product");
  const [categorySlug, setCategorySlug] = useState("rubber");
  const [title, setTitle] = useState("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [postedBanner, setPostedBanner] = useState<string | null>(null);

  const filteredCats = categories.filter((c) => c.type === categoryType);

  async function refreshList(nextCat = filterCat, nextQ = q) {
    setLoadingList(true);
    try {
      const res = await fetch(
        `/api/requirements?category=${encodeURIComponent(nextCat)}&q=${encodeURIComponent(nextQ)}`
      );
      const data = await res.json();
      setItems(data.items || []);
    } finally {
      setLoadingList(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
        return;
      }
      setAttachmentUrl(data.url);
      showToast("Document/image attached!", "success");
    } finally {
      setUploading(false);
    }
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          businessName,
          mobile,
          whatsapp: whatsapp || mobile,
          email,
          categoryType,
          categorySlug,
          title,
          quantity,
          location,
          description,
          attachmentUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Unable to post requirement.", "error");
        return;
      }
      setPostedBanner(data.message);
      showToast(data.message, "success");
      setTitle("");
      setQuantity("");
      setDescription("");
      setAttachmentUrl("");
      refreshList("all", "");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left: Find Requirements */}
      <div className="lg:col-span-7 space-y-5">
        <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search live buyer requirements..."
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-[#1652b8] focus:outline-none"
            />
          </div>
          <select
            value={filterCat}
            onChange={(e) => {
              setFilterCat(e.target.value);
              refreshList(e.target.value, q);
            }}
            aria-label="Filter requirement category"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-[#1652b8] focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => refreshList(filterCat, q)}
            className="rounded-xl bg-[#0a2458] hover:bg-[#06183d] text-white px-5 py-2 text-sm font-bold"
          >
            {loadingList ? "..." : "Find"}
          </button>
        </div>

        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-600">
              No active requirements match this filter.
            </div>
          ) : (
            items.map((req) => {
              const cleanWa = (req.whatsapp || req.mobile || "").replace(/\D/g, "");
              const waUrl = `https://wa.me/${cleanWa.length === 10 ? `91${cleanWa}` : cleanWa}?text=${encodeURIComponent(
                `Hello ${req.name}, I saw your requirement "${req.title}" on RAWMET.com and would like to submit a quote.`
              )}`;
              return (
                <article
                  key={req.id}
                  className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-[#0a2458] text-white px-3 py-0.5 text-[11px] font-bold uppercase">
                      {req.category_slug.replace(/-/g, " ")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 text-[11px] font-bold">
                      <Sparkles className="h-3 w-3" />
                      {req.matched_vendors_count} Vendor(s) Notified on WhatsApp
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-lg font-extrabold text-[#0a2458]">{req.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{req.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-slate-600">
                      <span className="font-semibold text-[#0a2458]">
                        Buyer: {req.business_name || req.name}
                      </span>
                      {req.quantity && <span>Qty: <strong>{req.quantity}</strong></span>}
                      {req.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-[#f97316]" />
                          {req.location}
                        </span>
                      )}
                    </div>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 font-bold"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Connect on WhatsApp</span>
                    </a>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Post Requirement Form */}
      <div id="post" className="lg:col-span-5">
        <div className="rounded-3xl bg-white border border-blue-100 p-6 sm:p-7 shadow-lg sticky top-24">
          <span className="inline-block rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 px-3 py-1 text-xs font-bold">
            Instant WhatsApp Matching
          </span>
          <h2 className="mt-2 text-xl font-extrabold text-[#0a2458]">Post Your Business Requirement</h2>
          <p className="text-xs text-slate-600 mt-1">
            Eligible GST-verified vendors in your category receive automatic WhatsApp Business Opportunity alerts.
          </p>

          {postedBanner && (
            <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <p className="font-semibold">{postedBanner}</p>
            </div>
          )}

          <form onSubmit={handlePost} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name *"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Business / Company Name"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Mobile Number *"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="WhatsApp Number"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={categoryType}
                onChange={(e) => {
                  const nextType = e.target.value as "product" | "machinery" | "service";
                  setCategoryType(nextType);
                  const first = categories.find((c) => c.type === nextType);
                  if (first) setCategorySlug(first.slug);
                }}
                aria-label="Requirement type"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:border-[#1652b8] focus:outline-none"
              >
                <option value="product">Products</option>
                <option value="machinery">Machineries</option>
                <option value="service">Services</option>
              </select>

              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                aria-label="Requirement category"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:border-[#1652b8] focus:outline-none"
              >
                {filteredCats.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product / Service Required (e.g. 10 MT Natural Rubber RSS4) *"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Quantity (e.g. 10 MT / 2 Units)"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Delivery Location / City"
                className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
              />
            </div>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technical specifications, grade, or delivery timeline..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />

            <label className="flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 cursor-pointer hover:border-[#1652b8]">
              <span className="flex items-center gap-2">
                <FileUp className="h-4 w-4 text-[#f97316]" />
                {uploading ? "Uploading..." : attachmentUrl ? "Document Attached ✓" : "Attach BoQ / Image / PDF (optional)"}
              </span>
              <input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" onChange={handleUpload} className="hidden" />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white py-3 px-6 text-sm font-bold shadow transition-all"
            >
              <Send className="h-4 w-4" />
              <span>{submitting ? "Matching Vendors..." : "Post Requirement & Notify Vendors"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

