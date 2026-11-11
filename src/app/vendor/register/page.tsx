"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, FileUp, ShieldCheck, Store } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

const CATEGORY_OPTIONS = [
  { value: "rubber", label: "Rubber Products" },
  { value: "plastic", label: "Plastic Products" },
  { value: "metals", label: "Metals" },
  { value: "bio-petro-chemical", label: "Bio Petro Chemical" },
  { value: "rubber-machineries", label: "Rubber Machineries" },
  { value: "plastic-machineries", label: "Plastic Machineries" },
  { value: "metals-plants", label: "Metals – Plants" },
  { value: "bpc-plants", label: "BPC – Plants" },
  { value: "vehicle-fabrication", label: "Vehicle – Fabrication – Bodybuilders" },
  { value: "manpower-services", label: "Manpower Services" },
  { value: "amc", label: "AMC Services" },
  { value: "maintenance-services", label: "Maintenance Services" },
  { value: "mechanical-services", label: "Mechanical Services" },
  { value: "logistics-services", label: "Logistics Services" },
  { value: "loans-services", label: "Loans Services" },
  { value: "business-registrations", label: "Business Registrations" },
  { value: "website-app-services", label: "Website / App Services" },
];

export default function VendorRegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    ownerName: "",
    businessName: "",
    mobile: "",
    whatsapp: "",
    email: "",
    password: "",
    businessCategory: "Manufacturer & Bulk Supplier",
    productServiceCategory: "rubber",
    gstNumber: "",
    idProofType: "GST Certificate",
    idProofUrl: "",
    logoUrl: "",
    address: "",
    city: "",
    state: "",
    description: "",
    productDetails: "",
    whatsappOptIn: true,
  });

  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function uploadFile(file: File, target: "idProofUrl" | "logoUrl") {
    if (target === "idProofUrl") setUploadingId(true);
    else setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
        return;
      }
      setForm((prev) => ({ ...prev, [target]: data.url }));
      showToast("File uploaded cleanly!", "success");
    } finally {
      setUploadingId(false);
      setUploadingLogo(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Registration failed.", "error");
        return;
      }
      showToast(data.message, "success");
      router.push("/vendor/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#0a2458] to-[#123983] p-6 sm:p-8 text-white shadow-lg mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316] px-3 py-1 text-xs font-bold">
          <BadgeCheck className="h-3.5 w-3.5" />
          Free Listings for GST-Verified Vendors
        </span>
        <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold">Vendor Business Registration</h1>
        <p className="mt-1 text-sm text-blue-100">
          Submit your GST Number / Authentic ID proof. Once Admin approves your verification, your free listings go live across RAWMET.com.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Owner / Contact Name *</label>
            <input
              type="text"
              required
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              placeholder="e.g. Rajesh Kulkarni"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Registered Business Name *</label>
            <input
              type="text"
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="e.g. Bharat Elastomers Pvt. Ltd."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (10 digits) *</label>
            <input
              type="tel"
              required
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              placeholder="e.g. 9820112233"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number *</label>
            <input
              type="tel"
              required
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="For real-time buyer alerts"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Business Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="sales@company.com"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Account Password (min 6 chars) *</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Create secure password"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Business Type *</label>
            <select
              value={form.businessCategory}
              onChange={(e) => setForm({ ...form, businessCategory: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:border-[#1652b8] focus:outline-none"
            >
              <option>Manufacturer &amp; Bulk Supplier</option>
              <option>Machinery OEM / Plant Builder</option>
              <option>Authorized Distributor / Trader</option>
              <option>Industrial Service Contractor</option>
              <option>Fabricator / Bodybuilder</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Primary Product / Service Category *</label>
            <select
              value={form.productServiceCategory}
              onChange={(e) => setForm({ ...form, productServiceCategory: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white focus:border-[#1652b8] focus:outline-none"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* GST / Authentic ID Section */}
        <div className="rounded-2xl bg-[#f4f8ff] border border-blue-100 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#0a2458]">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            GST / Authentic Business ID Verification (Mandatory)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ID Proof Type</label>
              <select
                value={form.idProofType}
                onChange={(e) => setForm({ ...form, idProofType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white"
              >
                <option>GST Certificate</option>
                <option>Udyam MSME Registration</option>
                <option>PAN / Certificate of Incorporation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GST Number / Authentic ID *</label>
              <input
                type="text"
                required
                value={form.gstNumber}
                onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                placeholder="e.g. 27AABCU9603R1ZM"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm uppercase bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Upload GST / ID Document</label>
              <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-white px-3 py-2.5 text-xs font-semibold text-[#0a2458] cursor-pointer hover:bg-blue-50">
                <FileUp className="h-4 w-4 text-[#f97316]" />
                <span>{uploadingId ? "Uploading..." : form.idProofUrl ? "Document Uploaded ✓" : "Upload PDF/Image"}</span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.pdf"
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "idProofUrl")}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Address & Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Pune"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="e.g. Maharashtra"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Company Logo (optional)</label>
            <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-xs font-semibold text-slate-600 cursor-pointer hover:border-[#1652b8]">
              <FileUp className="h-4 w-4 text-[#f97316]" />
              <span>{uploadingLogo ? "Uploading..." : form.logoUrl ? "Logo Uploaded ✓" : "Upload Logo"}</span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "logoUrl")}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Factory / Office Full Address *</label>
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Industrial Plot, MIDC/GIDC Phase, Pin Code"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Business Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Certifications, production capacity, years of experience..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Products / Services Offered</label>
            <textarea
              rows={3}
              value={form.productDetails}
              onChange={(e) => setForm({ ...form, productDetails: e.target.value })}
              placeholder="List key raw materials, machines, or services..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.whatsappOptIn}
            onChange={(e) => setForm({ ...form, whatsappOptIn: e.target.checked })}
            className="h-4 w-4 rounded accent-[#f97316]"
          />
          <span>
            Opt-in to receive <strong>Real-Time WhatsApp Business Opportunity Alerts</strong> for my category
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white py-3.5 px-6 text-sm font-extrabold shadow-lg transition-all"
        >
          <Store className="h-4 w-4" />
          <span>{submitting ? "Submitting Registration..." : "Submit Vendor Registration for Verification"}</span>
        </button>
      </form>
    </div>
  );
}

