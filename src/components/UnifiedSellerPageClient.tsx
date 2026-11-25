"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileText,
  FileUp,
  Inbox,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  PackagePlus,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import type { CategoryRecord, SubcategoryRecord, ListingRecord } from "@/lib/types";

interface UserInfo {
  id: number;
  name: string;
  email: string;
  mobile: string;
  whatsapp: string;
  role: string;
}

interface VendorInfo {
  id: number;
  user_id: number;
  business_name: string;
  owner_name: string;
  mobile: string;
  whatsapp: string;
  email: string;
  business_type?: string;
  business_category: string;
  product_service_category: string;
  gst_number: string;
  id_proof_url: string;
  address: string;
  city: string;
  state: string;
  description: string;
  verification_status: "pending" | "approved" | "rejected" | "suspended";
}

interface MasterProduct {
  id: number;
  title: string;
  type: string;
  category_slug: string;
  subcategory_slug: string;
  image_url: string;
  short_description: string;
  description: string;
  specifications: string;
  price_display: string;
}

export function UnifiedSellerPageClient() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [vendor, setVendor] = useState<VendorInfo | null>(null);

  // Categories & Subcategories
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryRecord[]>([]);

  // Active listings & enquiries
  const [myListings, setMyListings] = useState<ListingRecord[]>([]);
  const [myEnquiries, setMyEnquiries] = useState<Array<{
    id: number;
    name: string;
    mobile: string;
    message: string;
    listing_title: string;
    created_at: string;
  }>>([]);

  // Active dashboard tab for approved sellers
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "add" | "enquiries" | "profile">("overview");

  // --------------------------------------------------------------------------
  // FORM: REGISTRATION (Case B)
  // --------------------------------------------------------------------------
  const [regBusinessName, setRegBusinessName] = useState("");
  const [regBusinessType, setRegBusinessType] = useState("Manufacturer");
  const [regBusinessCategory, setRegBusinessCategory] = useState("Industrial Products");
  const [regGstNumber, setRegGstNumber] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regCity, setRegCity] = useState("");
  const [regState, setRegState] = useState("");
  const [regDescription, setRegDescription] = useState("");
  const [regIdProofUrl, setRegIdProofUrl] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submittingReg, setSubmittingReg] = useState(false);

  // --------------------------------------------------------------------------
  // FORM: ADD SELLER PRODUCT (3-STEP DYNAMIC DROPDOWNS - Case D)
  // --------------------------------------------------------------------------
  const [stepCategory, setStepCategory] = useState("");
  const [stepSubcategory, setStepSubcategory] = useState("");
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<MasterProduct | null>(null);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // Seller commercial info
  const [sellerPrice, setSellerPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("Kg");
  const [minOrderQty, setMinOrderQty] = useState("1");
  const [availableStock, setAvailableStock] = useState("In Stock");
  const [supplyLocation, setSupplyLocation] = useState("");
  const [sellerSpecs, setSellerSpecs] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");
  const [publishing, setPublishing] = useState(false);

  // Editing existing listing state
  const [editingListingId, setEditingListingId] = useState<number | null>(null);

  // Load session, vendor info, categories
  async function loadData() {
    setLoading(true);
    try {
      const [sessionRes, catRes] = await Promise.all([
        fetch("/api/auth/session"),
        fetch("/api/categories"),
      ]);

      const sessionData = await sessionRes.json();
      const catData = await catRes.json();

      if (sessionData.authenticated && sessionData.user) {
        setUser(sessionData.user);
        if (sessionData.vendor) {
          setVendor(sessionData.vendor);
          // If approved seller, load their listings and enquiries
          if (sessionData.vendor.verification_status === "approved") {
            loadSellerDetails();
          }
        }
      } else {
        setUser(null);
        setVendor(null);
      }

      setCategories(catData.categories || []);
      setSubcategories(catData.subcategories || []);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }

  async function loadSellerDetails() {
    try {
      const [listRes, profRes] = await Promise.all([
        fetch("/api/vendor/listings"),
        fetch("/api/vendor/profile"),
      ]);
      if (listRes.ok) {
        const ld = await listRes.json();
        setMyListings(ld.listings || []);
      }
      if (profRes.ok) {
        const pd = await profRes.json();
        setMyEnquiries(pd.enquiries || []);
      }
    } catch {
      // Ignored
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter subcategories by chosen category
  const filteredSubcategories = subcategories.filter(
    (s) => s.category_name?.toLowerCase() === stepCategory.toLowerCase() || (s as { category_slug?: string }).category_slug === stepCategory
  );

  // Fetch master products whenever category or subcategory changes
  async function loadMasterProducts(catSlug: string, subcatSlug: string) {
    if (!catSlug) {
      setMasterProducts([]);
      setSelectedMaster(null);
      return;
    }
    setLoadingMaster(true);
    try {
      const params = new URLSearchParams();
      if (catSlug) params.set("category_slug", catSlug);
      if (subcatSlug) params.set("subcategory_slug", subcatSlug);
      const res = await fetch(`/api/listings/master?${params.toString()}`);
      const data = await res.json();
      setMasterProducts(data.products || []);
    } finally {
      setLoadingMaster(false);
    }
  }

  function handleSelectCategory(catSlug: string) {
    setStepCategory(catSlug);
    setStepSubcategory("");
    setSelectedMaster(null);
    loadMasterProducts(catSlug, "");
  }

  function handleSelectSubcategory(subcatSlug: string) {
    setStepSubcategory(subcatSlug);
    setSelectedMaster(null);
    loadMasterProducts(stepCategory, subcatSlug);
  }

  function handleSelectMasterProduct(productId: string) {
    const prod = masterProducts.find((p) => String(p.id) === productId) || null;
    setSelectedMaster(prod);
    if (prod) {
      setSellerSpecs(prod.specifications || "");
      if (!supplyLocation && vendor?.city) {
        setSupplyLocation(`${vendor.city}, ${vendor.state || ""}`.trim());
      }
    }
  }

  // Upload GST / ID Document
  async function uploadDocument(file: File) {
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Upload failed", "error");
        return;
      }
      setRegIdProofUrl(data.url);
      showToast("Document uploaded successfully!", "success");
    } finally {
      setUploadingDoc(false);
    }
  }

  // Submit Registration (Case B)
  async function handleRegisterSeller(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingReg(true);
    try {
      const res = await fetch("/api/vendors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: regBusinessName,
          businessType: regBusinessType,
          businessCategory: regBusinessCategory,
          gstNumber: regGstNumber,
          address: regAddress,
          city: regCity,
          state: regState,
          description: regDescription,
          idProofUrl: regIdProofUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Registration failed.", "error");
        return;
      }

      showToast(data.message || "Seller application submitted! Status: Pending Approval", "success");
      loadData();
    } catch {
      showToast("Registration error. Please try again.", "error");
    } finally {
      setSubmittingReg(false);
    }
  }

  // Publish Listing (Automatic Approval - Case D)
  async function handlePublishListing(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMaster) {
      showToast("Please select an existing product from the catalogue.", "error");
      return;
    }
    if (!sellerPrice || Number(sellerPrice) <= 0) {
      showToast("Please enter a valid selling price.", "error");
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch("/api/vendor/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          master_product_id: selectedMaster.id,
          price_numeric: Number(sellerPrice),
          price_unit: priceUnit,
          min_order_qty: minOrderQty,
          availability: availableStock,
          location: supplyLocation || vendor?.city || "Pan India",
          specifications: sellerSpecs,
          description: sellerNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to publish listing.", "error");
        return;
      }

      showToast(data.message || "Listing published automatically and live on marketplace!", "success");
      // Reset form
      setStepCategory("");
      setStepSubcategory("");
      setSelectedMaster(null);
      setSellerPrice("");
      setSellerNotes("");
      setActiveTab("listings");
      loadSellerDetails();
    } catch {
      showToast("Error publishing listing. Please try again.", "error");
    } finally {
      setPublishing(false);
    }
  }

  // Toggle active/deactive listing
  async function handleToggleListingStatus(id: number, currentPublished: number | boolean | undefined) {
    const newStatus = currentPublished ? 0 : 1;
    try {
      const res = await fetch("/api/vendor/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_published: newStatus }),
      });
      if (res.ok) {
        showToast(newStatus ? "Listing activated and live." : "Listing deactivated.", "info");
        loadSellerDetails();
      }
    } catch {
      showToast("Failed to update listing status.", "error");
    }
  }

  // Delete listing
  async function handleDeleteListing(id: number) {
    if (!confirm("Are you sure you want to remove this product listing?")) return;
    try {
      const res = await fetch(`/api/vendor/listings?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Listing deleted successfully.", "info");
        loadSellerDetails();
      }
    } catch {
      showToast("Failed to delete listing.", "error");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-[#0a2458] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-[#0a2458]">Loading Seller Portal...</p>
      </div>
    );
  }

  // ==========================================================================
  // CASE A: USER IS NOT LOGGED IN
  // ==========================================================================
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="rounded-3xl bg-gradient-to-r from-[#0a2458] to-[#123983] p-8 sm:p-12 text-white shadow-xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316] px-3.5 py-1 text-xs font-black uppercase tracking-wider">
            <Store className="h-3.5 w-3.5" />
            RAWMAT MART Seller Portal
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
            Sell on India's Real-Time B2B Industrial Portal
          </h1>
          <p className="mt-3 text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            One common account for both Buying and Selling. Register or log in to your RAWMAT MART account to manage listings, connect with buyers, and grow your industrial sales.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login?next=/vendor/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-8 py-3.5 text-sm font-extrabold shadow-lg transition-all transform active:scale-98"
            >
              <Store className="h-4 w-4" />
              <span>REGISTER AS A SELLER</span>
            </Link>
            <Link
              href="/seller/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-slate-100 text-[#0a2458] px-8 py-3.5 text-sm font-extrabold shadow-lg transition-all transform active:scale-98"
            >
              <Lock className="h-4 w-4 text-[#0a2458]" />
              <span>LOGIN TO SELLER ACCOUNT</span>
            </Link>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <BadgeCheck className="h-8 w-8 text-[#f97316] mb-3" />
            <h3 className="font-extrabold text-[#0a2458] text-base">GST Verified Trust</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Showcase authentic GST credentials and build immediate credibility with industrial bulk buyers across India.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <Package className="h-8 w-8 text-[#0a2458] mb-3" />
            <h3 className="font-extrabold text-[#0a2458] text-base">Instant Catalogue Publishing</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Select verified admin products and set your own competitive prices, MOQ, and supply locations with instant approval.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <MessageCircle className="h-8 w-8 text-emerald-600 mb-3" />
            <h3 className="font-extrabold text-[#0a2458] text-base">Direct WhatsApp & Calls</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Receive verified buyer enquiries and quotations directly on your phone and WhatsApp in real time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // CASE B: LOGGED IN, BUT HAS NOT APPLIED AS A SELLER
  // ==========================================================================
  if (!vendor) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0a2458] to-[#123983] p-6 sm:p-8 text-white shadow-lg mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316] px-3 py-1 text-xs font-bold">
            <BadgeCheck className="h-3.5 w-3.5" />
            Common User Account Linked: {user.name} ({user.email})
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold">Seller Business Registration</h1>
          <p className="mt-1 text-xs sm:text-sm text-blue-100">
            Apply to become a verified seller using your existing account. No new password needed!
          </p>
        </div>

        {/* Application Form */}
        <form onSubmit={handleRegisterSeller} className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Owner / Contact Name *</label>
              <input
                type="text"
                disabled
                value={user.name}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600 font-medium"
              />
              <span className="text-[11px] text-slate-400">Pre-filled from your account</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Business Name *</label>
              <input
                type="text"
                required
                value={regBusinessName}
                onChange={(e) => setRegBusinessName(e.target.value)}
                placeholder="e.g. Bharat Rubber Products Pvt Ltd"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number *</label>
              <input
                type="text"
                disabled
                value={user.mobile}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Email *</label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600 font-medium"
              />
            </div>

            {/* Business Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Business Type *</label>
              <select
                value={regBusinessType}
                onChange={(e) => setRegBusinessType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
              >
                <option value="Manufacturer">Manufacturer</option>
                <option value="Bulk Supplier">Bulk Supplier</option>
                <option value="Distributor">Distributor</option>
                <option value="Wholesaler">Wholesaler</option>
                <option value="Retailer">Retailer</option>
                <option value="Service Provider">Service Provider</option>
              </select>
            </div>

            {/* Primary Business Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Category *</label>
              <select
                value={regBusinessCategory}
                onChange={(e) => setRegBusinessCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-[#0a2458] focus:border-[#0a2458] focus:outline-none"
              >
                <option value="Industrial Products">Industrial Products</option>
                <option value="Machinery & Equipment">Machinery & Equipment</option>
                <option value="Services">Services</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">GST Number / Authentic Business ID *</label>
              <input
                type="text"
                required
                value={regGstNumber}
                onChange={(e) => setRegGstNumber(e.target.value.toUpperCase())}
                placeholder="e.g. 36AABCU9603R1ZM"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm uppercase font-mono focus:border-[#0a2458] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Upload GST / Business ID Proof (Optional)</label>
              <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 px-3 py-2.5 text-xs font-semibold text-[#0a2458] cursor-pointer hover:bg-blue-100/50 transition-colors">
                <FileUp className="h-4 w-4 text-[#f97316]" />
                <span>{uploadingDoc ? "Uploading..." : regIdProofUrl ? "Document Uploaded ✓" : "Upload Document (PDF/Image)"}</span>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.pdf"
                  onChange={(e) => e.target.files?.[0] && uploadDocument(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">City *</label>
              <input
                type="text"
                required
                value={regCity}
                onChange={(e) => setRegCity(e.target.value)}
                placeholder="e.g. Guntur / Hyderabad"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">State *</label>
              <input
                type="text"
                required
                value={regState}
                onChange={(e) => setRegState(e.target.value)}
                placeholder="e.g. Andhra Pradesh / Telangana"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Factory / Office Full Address *</label>
            <input
              type="text"
              required
              value={regAddress}
              onChange={(e) => setRegAddress(e.target.value)}
              placeholder="Plot No, Industrial Estate, Phase, PIN Code"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Business & Product Description</label>
            <textarea
              rows={3}
              value={regDescription}
              onChange={(e) => setRegDescription(e.target.value)}
              placeholder="Certifications, years in business, manufacturing capacity..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submittingReg}
            className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white py-3.5 text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {submittingReg ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Store className="h-4 w-4" />
                <span>Submit Seller Application for Verification</span>
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // ==========================================================================
  // CASE C: PENDING APPROVAL
  // ==========================================================================
  if (vendor.verification_status === "pending") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="rounded-3xl bg-amber-50 border-2 border-amber-300 p-6 sm:p-10 shadow-lg text-center">
          <Clock className="h-14 w-14 text-amber-600 mx-auto mb-4 animate-pulse" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/60 text-amber-900 px-3 py-1 text-xs font-bold uppercase">
            Application Status: Pending Verification
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-950 mt-3">
            Your Seller Application is Under Admin Verification
          </h2>
          <p className="mt-3 text-sm sm:text-base text-amber-900 max-w-xl mx-auto leading-relaxed">
            Your seller application for <strong>{vendor.business_name}</strong> has been received and is currently under review by our Admin verification team. Please wait for approval.
          </p>

          <div className="mt-6 rounded-2xl bg-white border border-amber-200 p-4 text-xs text-slate-700 max-w-lg mx-auto text-left space-y-1.5">
            <div><strong>Registered Business:</strong> {vendor.business_name}</div>
            <div><strong>GST / ID:</strong> {vendor.gst_number}</div>
            <div><strong>Category:</strong> {vendor.business_category}</div>
            <div><strong>Location:</strong> {vendor.city}, {vendor.state}</div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-[#0a2458] hover:bg-[#1652b8] text-white px-6 py-2.5 text-xs font-bold shadow"
            >
              Continue Browsing as Buyer
            </Link>
            <a
              href="tel:+917382177653"
              className="rounded-full border border-amber-600 text-amber-900 hover:bg-amber-100 px-6 py-2.5 text-xs font-bold transition-colors"
            >
              Need Urgent Approval? Call +91 7382177653
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // CASE E: REJECTED
  // ==========================================================================
  if (vendor.verification_status === "rejected") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="rounded-3xl bg-rose-50 border-2 border-rose-300 p-6 sm:p-10 shadow-lg text-center">
          <ShieldAlert className="h-14 w-14 text-rose-600 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-rose-950">
            Your Seller Application Has Not Been Approved
          </h2>
          <p className="mt-3 text-sm sm:text-base text-rose-900 max-w-xl mx-auto leading-relaxed">
            Please contact the administrator for further information regarding verification requirements and resubmission.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="tel:+917382177653"
              className="rounded-full bg-[#0a2458] text-white px-6 py-2.5 text-xs font-bold"
            >
              Contact Support: +91 7382177653
            </a>
            <Link
              href="/dashboard"
              className="rounded-full border border-slate-300 text-slate-700 px-6 py-2.5 text-xs font-bold"
            >
              Return to Buyer Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // CASE D: APPROVED SELLER - INLINE DASHBOARD & 3-STEP DROPDOWN LISTINGS!
  // ==========================================================================
  const actionButtonText =
    vendor.business_category === "Services"
      ? "START ADDING SERVICES"
      : vendor.business_category === "Machinery & Equipment"
      ? "ADD YOUR INDUSTRIAL & MACHINERY PRODUCTS"
      : "START ADDING PRODUCTS";

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">
      {/* 1. SELLER APPROVAL SUCCESS NOTIFICATION BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0a2458] via-[#123983] to-[#0a2458] p-6 sm:p-8 text-white shadow-xl mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/25 border border-emerald-400 text-emerald-300 px-3 py-1 text-xs font-black uppercase tracking-wider">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Your Vendor Account Has Been Approved!
              </span>
              <span className="rounded-full bg-[#f97316] px-3 py-0.5 text-xs font-bold uppercase">
                {vendor.business_category}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              {vendor.business_name}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
              Congratulations! Your seller account has been successfully approved. Kindly start listing your products and reach thousands of buyers on RAWMAT MART.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("add")}
              className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-6 py-3 text-xs sm:text-sm font-extrabold shadow-lg transition-all transform active:scale-98 flex items-center gap-2"
            >
              <PackagePlus className="h-4 w-4" />
              <span>{actionButtonText}</span>
            </button>
            <Link
              href="/dashboard"
              className="rounded-full bg-white/10 hover:bg-white/20 text-white px-5 py-3 text-xs sm:text-sm font-bold transition-colors"
            >
              Switch to Buyer Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-3">
        {[
          { id: "overview", label: "Overview", icon: Building2 },
          { id: "listings", label: `My Active Listings (${myListings.length})`, icon: Package },
          { id: "add", label: `+ ${actionButtonText}`, icon: Plus },
          { id: "enquiries", label: `Buyer Enquiries (${myEnquiries.length})`, icon: Inbox },
          { id: "profile", label: "Seller Profile & GST", icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`rounded-full px-4 py-2 text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#0a2458] text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Live Listings</span>
              <div className="text-3xl font-black text-[#0a2458] mt-1">{myListings.length}</div>
              <p className="text-xs text-slate-500 mt-1">Active on RAWMAT MART marketplace</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Buyer Enquiries</span>
              <div className="text-3xl font-black text-[#f97316] mt-1">{myEnquiries.length}</div>
              <p className="text-xs text-slate-500 mt-1">Quotations & direct enquiries</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Seller Category</span>
              <div className="text-base font-extrabold text-[#0a2458] mt-2 truncate">{vendor.business_category}</div>
              <p className="text-xs text-slate-500 mt-1">{vendor.business_type || "Industrial Supplier"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-400 uppercase">GST Verification</span>
              <div className="text-sm font-extrabold text-emerald-600 mt-2 flex items-center gap-1">
                <BadgeCheck className="h-4 w-4" />
                <span>{vendor.gst_number}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Approved & Verified</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-extrabold text-[#0a2458] mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-5 py-2.5 text-xs font-extrabold shadow-sm flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>{actionButtonText}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("listings")}
                className="rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 text-xs font-bold"
              >
                Manage Active Listings ({myListings.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("enquiries")}
                className="rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 text-xs font-bold"
              >
                View Buyer Inquiries
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ADD LISTING (DYNAMIC 3-STEP DROPDOWNS - NO SELLER IMAGE UPLOADS!) */}
      {activeTab === "add" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-[#0a2458] px-3 py-1 text-xs font-extrabold uppercase">
              <Sparkles className="h-3.5 w-3.5 text-[#f97316]" />
              Step-by-Step Catalogue Selection
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#0a2458] mt-2">
              Select Verified Product from Admin Catalogue
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select existing admin-approved products, machinery, or services. Master product images are managed by the platform. You simply set your selling price and commercial terms for instant publishing!
            </p>
          </div>

          <form onSubmit={handlePublishListing} className="space-y-6">
            {/* Step 1 & Step 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Step 1: Select Main Category *
                </label>
                <select
                  required
                  value={stepCategory}
                  onChange={(e) => handleSelectCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-[#0a2458] focus:border-[#0a2458] focus:outline-none"
                >
                  <option value="">-- Choose Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Step 2: Select Subcategory *
                </label>
                <select
                  disabled={!stepCategory}
                  value={stepSubcategory}
                  onChange={(e) => handleSelectSubcategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 focus:border-[#0a2458] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">-- Choose Subcategory (Optional) --</option>
                  {filteredSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.slug}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3: Select Existing Product */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Step 3: Select Existing Product / Machinery / Service *
              </label>
              <select
                required
                disabled={!stepCategory || loadingMaster}
                value={selectedMaster?.id || ""}
                onChange={(e) => handleSelectMasterProduct(e.target.value)}
                className="w-full rounded-xl border-2 border-[#0a2458]/40 bg-white px-4 py-3 text-sm font-bold text-[#0a2458] focus:border-[#0a2458] focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">
                  {loadingMaster ? "Loading catalogue..." : "-- Select Master Product --"}
                </option>
                {masterProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Master Product Preview (Admin Image & Details) */}
            {selectedMaster && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 animate-fadeIn">
                <img
                  src={selectedMaster.image_url || "/images/cat-products.png"}
                  alt={selectedMaster.title}
                  className="h-28 w-28 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                />
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#0a2458] text-white px-2.5 py-0.5 text-[11px] font-bold uppercase">
                    Admin Verified Master Image
                  </span>
                  <h3 className="text-base font-extrabold text-[#0a2458] mt-1">
                    {selectedMaster.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {selectedMaster.description || selectedMaster.short_description}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-2 font-mono">
                    Category: {selectedMaster.category_slug} • Image managed by Admin Panel
                  </p>
                </div>
              </div>
            )}

            {/* Commercial Parameters Form */}
            {selectedMaster && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
                <h4 className="font-extrabold text-[#0a2458] text-sm uppercase tracking-wide">
                  Your Commercial Offer & Terms
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={sellerPrice}
                      onChange={(e) => setSellerPrice(e.target.value)}
                      placeholder="e.g. 250"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-[#f97316] focus:border-[#0a2458] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Price Unit *
                    </label>
                    <select
                      value={priceUnit}
                      onChange={(e) => setPriceUnit(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold focus:border-[#0a2458] focus:outline-none"
                    >
                      <option value="Kg">Per Kg</option>
                      <option value="Piece">Per Piece</option>
                      <option value="Ton">Per Ton</option>
                      <option value="Meter">Per Meter</option>
                      <option value="Unit">Per Unit / Machine</option>
                      <option value="Set">Per Set</option>
                      <option value="Liter">Per Liter</option>
                      <option value="Project">Per Project / Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Min Order Qty (MOQ) *
                    </label>
                    <input
                      type="text"
                      required
                      value={minOrderQty}
                      onChange={(e) => setMinOrderQty(e.target.value)}
                      placeholder="e.g. 10 Kg or 1 Unit"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Stock Availability *
                    </label>
                    <select
                      value={availableStock}
                      onChange={(e) => setAvailableStock(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
                    >
                      <option value="In Stock">In Stock (Immediate Dispatch)</option>
                      <option value="Ready for Dispatch">Ready for Dispatch (1-2 Days)</option>
                      <option value="Made to Order">Made to Order / Production on Demand</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Supply / Dispatch Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={supplyLocation}
                      onChange={(e) => setSupplyLocation(e.target.value)}
                      placeholder="e.g. Guntur, Andhra Pradesh"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Seller-Specific Notes / Commercial Terms (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={sellerNotes}
                    onChange={(e) => setSellerNotes(e.target.value)}
                    placeholder="e.g. GST extra, freight at actuals, test certificates provided..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs focus:border-[#0a2458] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={publishing}
                  className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white py-3.5 text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {publishing ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Publish Listing (Instant Automatic Approval)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB: MY LISTINGS */}
      {activeTab === "listings" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-[#0a2458]">My Active Listings ({myListings.length})</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your prices, minimum order quantities, and live availability.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("add")}
              className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-5 py-2.5 text-xs font-extrabold shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{actionButtonText}</span>
            </button>
          </div>

          {myListings.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200">
              <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No products listed yet.</p>
              <p className="text-xs text-slate-400 mt-1">Select from the master catalogue and start selling today.</p>
              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className="mt-4 rounded-full bg-[#0a2458] text-white px-6 py-2.5 text-xs font-bold"
              >
                + Add Your First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px]">
                    <th className="pb-3 font-bold">Product</th>
                    <th className="pb-3 font-bold">Offered Price</th>
                    <th className="pb-3 font-bold">Location</th>
                    <th className="pb-3 font-bold">Status</th>
                    <th className="pb-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myListings.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 pr-4 flex items-center gap-3">
                        <img
                          src={l.image_url || "/images/cat-products.png"}
                          alt={l.title}
                          className="h-11 w-11 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                        />
                        <div>
                          <Link
                            href={`/listings/${l.slug}`}
                            className="font-bold text-[#0a2458] hover:underline line-clamp-1"
                          >
                            {l.title}
                          </Link>
                          <span className="text-[11px] text-slate-400">
                            {l.category_slug} • MOQ: {l.min_order_qty || "1"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 font-black text-[#f97316] text-sm">
                        {l.price_display}
                      </td>
                      <td className="py-3.5 text-slate-600">
                        {l.location || "Pan India"}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            l.is_published !== 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {l.is_published !== 0 ? "Live / Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleListingStatus(l.id, l.is_published)}
                          className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${
                            l.is_published !== 0
                              ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          }`}
                        >
                          {l.is_published !== 0 ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteListing(l.id)}
                          className="rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1 text-[11px] font-bold transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: BUYER ENQUIRIES */}
      {activeTab === "enquiries" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#0a2458] mb-4">Buyer Trade Enquiries ({myEnquiries.length})</h2>
          {myEnquiries.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No enquiries received yet. Keep your prices competitive to receive more buyer requests!
            </div>
          ) : (
            <div className="space-y-3">
              {myEnquiries.map((enq) => (
                <div key={enq.id} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="font-extrabold text-sm text-[#0a2458]">{enq.name}</span>
                    <span className="text-[11px] text-slate-400">{enq.created_at}</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    Enquiry for: <strong>{enq.listing_title}</strong>
                  </p>
                  <p className="text-xs bg-white rounded-xl p-3 border border-slate-200 text-slate-700 leading-relaxed">
                    "{enq.message}"
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <a
                      href={`tel:${enq.mobile}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0a2458] hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Call Buyer ({enq.mobile})</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: PROFILE */}
      {activeTab === "profile" && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm max-w-2xl">
          <h2 className="text-xl font-extrabold text-[#0a2458] mb-4">Seller Business Information</h2>
          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <span className="text-slate-400 block mb-0.5">Registered Business Name</span>
              <strong className="text-sm text-slate-800">{vendor.business_name}</strong>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <span className="text-slate-400 block mb-0.5">Proprietor / Contact Person</span>
              <strong className="text-sm text-slate-800">{vendor.owner_name}</strong>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <span className="text-slate-400 block mb-0.5">GST Number</span>
              <strong className="text-sm text-emerald-700">{vendor.gst_number}</strong>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <span className="text-slate-400 block mb-0.5">Primary Category</span>
              <strong className="text-sm text-slate-800">{vendor.business_category}</strong>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
              <span className="text-slate-400 block mb-0.5">Business Address</span>
              <p className="text-slate-700">{vendor.address}, {vendor.city}, {vendor.state}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
