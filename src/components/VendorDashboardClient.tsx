"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  CheckCircle2,
  Edit3,
  FileUp,
  MessageCircle,
  MessageSquare,
  PackagePlus,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import type { ListingRecord, RequirementRecord, VendorRecord } from "@/lib/types";
import { useToast } from "./ToastProvider";

const ALL_CATEGORY_SLUGS = [
  { type: "product", slug: "rubber", label: "Rubber (Product)" },
  { type: "product", slug: "plastic", label: "Plastic (Product)" },
  { type: "product", slug: "metals", label: "Metals (Product)" },
  { type: "product", slug: "bio-petro-chemical", label: "Bio Petro Chemical (Product)" },
  { type: "machinery", slug: "rubber-machineries", label: "Rubber Machineries" },
  { type: "machinery", slug: "plastic-machineries", label: "Plastic Machineries" },
  { type: "machinery", slug: "metals-plants", label: "Metals – Plants" },
  { type: "machinery", slug: "bpc-plants", label: "BPC – Plants" },
  { type: "machinery", slug: "vehicle-fabrication", label: "Vehicle – Fabrication" },
  { type: "service", slug: "manpower-services", label: "Manpower Services" },
  { type: "service", slug: "amc", label: "AMC Services" },
  { type: "service", slug: "maintenance-services", label: "Maintenance Services" },
  { type: "service", slug: "mechanical-services", label: "Mechanical Services" },
  { type: "service", slug: "logistics-services", label: "Logistics Services" },
  { type: "service", slug: "loans-services", label: "Loans Services" },
  { type: "service", slug: "business-registrations", label: "Business Registrations" },
  { type: "service", slug: "website-app-services", label: "Website / App Services" },
];

export function VendorDashboardClient() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorRecord | null>(null);
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [enquiries, setEnquiries] = useState<Array<{ id: number; name: string; business_name: string; mobile: string; message: string; listing_title: string; created_at: string }>>([]);
  const [waNotifications, setWaNotifications] = useState<Array<{ id: number; category_slug: string; message_preview: string; requirement_title: string; buyer_mobile: string; created_at: string }>>([]);
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);
  const [tab, setTab] = useState<"overview" | "listings" | "add" | "requirements" | "enquiries" | "whatsapp" | "profile">("overview");

  // Add/Edit listing form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formType, setFormType] = useState<"product" | "machinery" | "service">("product");
  const [formCat, setFormCat] = useState("rubber");
  const [formTitle, setFormTitle] = useState("");
  const [formShort, setFormShort] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formPrice, setFormPrice] = useState("Request Quote");
  const [formAvail, setFormAvail] = useState("In Stock");
  const [formImage, setFormImage] = useState("/images/cat-products.png");
  const [savingListing, setSavingListing] = useState(false);

  // WhatsApp & profile state
  const [waOptIn, setWaOptIn] = useState(true);
  const [waCats, setWaCats] = useState<string[]>([]);

  async function loadAll() {
    setLoading(true);
    try {
      const [listRes, profRes] = await Promise.all([
        fetch("/api/vendor/listings"),
        fetch("/api/vendor/profile"),
      ]);
      if (listRes.status === 401 || profRes.status === 401) {
        router.push("/login?next=/vendor/dashboard");
        return;
      }
      const listData = await listRes.json();
      const profData = await profRes.json();
      setVendor(profData.vendor || listData.vendor);
      setListings(listData.listings || []);
      setEnquiries(profData.enquiries || []);
      setWaNotifications(profData.notifications || []);
      setRequirements(profData.requirements || []);
      if (profData.vendor) {
        setWaOptIn(Boolean(profData.vendor.whatsapp_opt_in));
        try {
          setWaCats(JSON.parse(profData.vendor.whatsapp_categories || "[]"));
        } catch {
          setWaCats([]);
        }
        setFormLocation(`${profData.vendor.city || ""}${profData.vendor.state ? ", " + profData.vendor.state : ""}`);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) {
      showToast(data.error || "Image upload failed", "error");
      return;
    }
    setFormImage(data.url);
    showToast("Listing image uploaded!", "success");
  }

  async function handleSaveListing(e: React.FormEvent) {
    e.preventDefault();
    setSavingListing(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch("/api/vendor/listings", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId || undefined,
          type: formType,
          category_slug: formCat,
          title: formTitle,
          short_description: formShort,
          description: formDesc,
          location: formLocation,
          price_display: formPrice,
          availability: formAvail,
          image_url: formImage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Unable to save listing.", "error");
        return;
      }
      showToast(data.message, "success");
      setEditingId(null);
      setFormTitle("");
      setFormShort("");
      setFormDesc("");
      setTab("listings");
      loadAll();
    } finally {
      setSavingListing(false);
    }
  }

  async function handleDeleteListing(id: number) {
    const res = await fetch(`/api/vendor/listings?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Listing deleted.", "info");
      loadAll();
    }
  }

  async function saveWhatsappControls() {
    const res = await fetch("/api/vendor/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ whatsapp_opt_in: waOptIn, whatsapp_categories: waCats }),
    });
    const data = await res.json();
    if (res.ok) showToast(data.message, "success");
    else showToast(data.error || "Update failed", "error");
  }

  if (loading || !vendor) {
    return <div className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-slate-500">Loading Vendor Portal...</div>;
  }

  const isVerified = vendor.verification_status === "approved";

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0a2458] to-[#123983] p-6 sm:p-8 text-white shadow-lg mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#f97316] px-3 py-0.5 text-xs font-bold uppercase">
              Vendor Portal
            </span>
            <span
              className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase ${
                isVerified
                  ? "bg-emerald-500/25 text-emerald-200 border border-emerald-400/40"
                  : "bg-amber-500/25 text-amber-200 border border-amber-400/40"
              }`}
            >
              Verification: {vendor.verification_status}
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold">{vendor.business_name}</h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
            GSTIN / ID: <strong>{vendor.gst_number}</strong> • {vendor.city}, {vendor.state}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setTab("add");
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316] hover:bg-[#ea580c] px-5 py-2.5 text-sm font-bold text-white shadow"
          >
            <Plus className="h-4 w-4" />
            Add Free Listing
          </button>
          <Link
            href="/subscriptions"
            className="rounded-full bg-white text-[#0a2458] px-5 py-2.5 text-sm font-bold shadow"
          >
            Upgrade Subscription
          </Link>
        </div>
      </div>

      {!isVerified && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 mb-6 flex items-start gap-3 text-sm text-amber-950">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Verification Status: {vendor.verification_status.toUpperCase()}</p>
            <p className="text-xs mt-0.5">
              Free listings require GST / Authentic ID verification approval by Admin before you can publish live catalog items.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "overview", label: "Overview" },
          { id: "listings", label: `My Listings (${listings.length})` },
          { id: "add", label: editingId ? "Edit Listing" : "+ Add Listing" },
          { id: "requirements", label: `Live Requirements (${requirements.length})` },
          { id: "enquiries", label: `Enquiries (${enquiries.length})` },
          { id: "whatsapp", label: `WhatsApp Alerts (${waNotifications.length})` },
          { id: "profile", label: "Profile & GST" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className={`rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              tab === t.id
                ? "bg-[#0a2458] text-white shadow"
                : "bg-white border border-slate-200 text-slate-700 hover:border-[#0a2458]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Listings</p>
            <p className="text-3xl font-extrabold text-[#0a2458] mt-1">{listings.length}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-500 uppercase">Approved Live</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">
              {listings.filter((l) => l.status === "approved").length}
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-500 uppercase">Customer Enquiries</p>
            <p className="text-3xl font-extrabold text-[#f97316] mt-1">{enquiries.length}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-500 uppercase">WhatsApp Leads</p>
            <p className="text-3xl font-extrabold text-[#1652b8] mt-1">{waNotifications.length}</p>
          </div>
        </div>
      )}

      {tab === "listings" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((l) => (
            <div key={l.id} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="h-40 bg-slate-100 relative">
                <img src={l.image_url} alt={l.title} className="h-full w-full object-cover" />
                <span
                  className={`absolute top-3 right-3 rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase ${
                    l.status === "approved"
                      ? "bg-emerald-600 text-white"
                      : l.status === "rejected"
                        ? "bg-red-600 text-white"
                        : "bg-amber-500 text-white"
                  }`}
                >
                  {l.status}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#1652b8]">
                    {l.type} • {l.category_slug}
                  </span>
                  <h3 className="font-bold text-[#0a2458] mt-1">{l.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{l.price_display}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(l.id);
                      setFormType(l.type);
                      setFormCat(l.category_slug);
                      setFormTitle(l.title);
                      setFormShort(l.short_description);
                      setFormDesc(l.description);
                      setFormLocation(l.location);
                      setFormPrice(l.price_display);
                      setFormAvail(l.availability);
                      setFormImage(l.image_url);
                      setTab("add");
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-[#0a2458] hover:bg-slate-50"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteListing(l.id)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "add" && (
        <form onSubmit={handleSaveListing} className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 max-w-3xl space-y-4">
          <h2 className="text-xl font-extrabold text-[#0a2458] flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-[#f97316]" />
            {editingId ? "Edit Free Listing" : "Add Free Verified Listing"}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={formType}
              onChange={(e) => {
                const nt = e.target.value as "product" | "machinery" | "service";
                setFormType(nt);
                const first = ALL_CATEGORY_SLUGS.find((c) => c.type === nt);
                if (first) setFormCat(first.slug);
              }}
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white"
            >
              <option value="product">Product</option>
              <option value="machinery">Machinery</option>
              <option value="service">Service</option>
            </select>

            <select
              value={formCat}
              onChange={(e) => setFormCat(e.target.value)}
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white"
            >
              {ALL_CATEGORY_SLUGS.filter((c) => c.type === formType).map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            required
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Listing Title *"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />

          <input
            type="text"
            required
            value={formShort}
            onChange={(e) => setFormShort(e.target.value)}
            placeholder="Short summary for marketplace cards *"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />

          <textarea
            rows={4}
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            placeholder="Detailed specifications, grades, MOQ, and warranty..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="Location"
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
            <input
              type="text"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              placeholder="Price / Quote"
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
            <input
              type="text"
              value={formAvail}
              onChange={(e) => setFormAvail(e.target.value)}
              placeholder="Availability"
              className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-xs font-bold text-[#0a2458] cursor-pointer hover:border-[#1652b8]">
              <FileUp className="h-4 w-4 text-[#f97316]" />
              <span>Upload Listing Photo</span>
              <input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleImageUpload} className="hidden" />
            </label>
            <img src={formImage} alt="Preview" className="h-14 w-20 rounded-lg object-cover border" />
          </div>

          <button
            type="submit"
            disabled={savingListing}
            className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-7 py-3 text-sm font-bold shadow"
          >
            {savingListing ? "Saving..." : editingId ? "Update Listing" : "Submit Free Listing"}
          </button>
        </form>
      )}

      {tab === "requirements" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requirements.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white border border-slate-200 p-5">
              <span className="text-[11px] font-bold uppercase text-[#f97316]">{r.category_slug}</span>
              <h3 className="font-bold text-[#0a2458] mt-1">{r.title}</h3>
              <p className="text-xs text-slate-600 mt-1">{r.description}</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span>Qty: <strong>{r.quantity}</strong> • {r.location}</span>
                <a
                  href={`https://wa.me/${(r.whatsapp || r.mobile).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-emerald-700"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Contact Buyer
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "enquiries" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
          {enquiries.length === 0 ? (
            <p className="text-sm text-slate-600">No enquiries received yet.</p>
          ) : (
            enquiries.map((e) => (
              <div key={e.id} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#0a2458]">{e.listing_title || "Direct Enquiry"}</span>
                  <span className="text-slate-500">{e.mobile}</span>
                </div>
                <p className="text-xs text-slate-500">From: {e.name} ({e.business_name || "Buyer"})</p>
                <p className="text-sm text-slate-700 mt-1.5">{e.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "whatsapp" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-white border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-extrabold text-[#0a2458] flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#f97316]" />
              WhatsApp Notification Controls
            </h2>
            <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={waOptIn}
                onChange={(e) => setWaOptIn(e.target.checked)}
                className="h-4 w-4 accent-[#f97316]"
              />
              Enable Real-Time WhatsApp Opportunity Alerts
            </label>

            <div>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Alert Categories</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pr-1">
                {ALL_CATEGORY_SLUGS.map((c) => {
                  const checked = waCats.includes(c.slug);
                  return (
                    <label key={c.slug} className="flex items-center gap-2 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setWaCats((prev) =>
                            checked ? prev.filter((x) => x !== c.slug) : [...prev, c.slug]
                          )
                        }
                      />
                      <span>{c.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={saveWhatsappControls}
              className="w-full rounded-full bg-[#0a2458] text-white py-2.5 text-sm font-bold"
            >
              Save Notification Preferences
            </button>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
            <h2 className="text-lg font-extrabold text-[#0a2458] flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              Matched Opportunity Feed
            </h2>
            {waNotifications.length === 0 ? (
              <p className="text-sm text-slate-500">No WhatsApp opportunity alerts triggered yet for your categories.</p>
            ) : (
              waNotifications.map((n) => (
                <div key={n.id} className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-4 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-emerald-900">
                    <span className="uppercase">{n.category_slug}</span>
                    <span>{n.created_at}</span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-line">{n.message_preview}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 max-w-2xl space-y-3 text-sm">
          <h2 className="text-lg font-extrabold text-[#0a2458] flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-emerald-600" />
            GST &amp; Business Verification Profile
          </h2>
          <p><strong>Business Name:</strong> {vendor.business_name}</p>
          <p><strong>Owner:</strong> {vendor.owner_name}</p>
          <p><strong>Category:</strong> {vendor.business_category} ({vendor.product_service_category})</p>
          <p><strong>GST / ID Proof:</strong> {vendor.gst_number} ({vendor.id_proof_type})</p>
          <p><strong>Verification Status:</strong> <span className="uppercase font-bold text-[#f97316]">{vendor.verification_status}</span></p>
          <p><strong>Address:</strong> {vendor.address}, {vendor.city}, {vendor.state}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 pt-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Free listings are enabled automatically once Admin approves your GST / Authentic ID.
          </p>
        </div>
      )}
    </div>
  );
}

