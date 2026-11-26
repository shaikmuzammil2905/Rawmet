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
  EyeOff,
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
import { ChangePasswordCard } from "@/components/ChangePasswordCard";
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
  primary_category?: string;
  business_category: string;
  product_service_category: string;
  gst_number: string;
  id_proof_url: string;
  address: string;
  city: string;
  state: string;
  description: string;
  verification_status: "pending" | "approved" | "rejected" | "suspended";
  rejection_reason?: string;
  selected_business_types?: string;
  selected_categories?: string;
  selected_subcategories?: string;
  other_business_type?: string;
  other_categories?: string;
  other_subcategories?: string;
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
  // FORM: REGISTRATION (Case B & Guest Direct Registration)
  // --------------------------------------------------------------------------
  const [regOwnerName, setRegOwnerName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [regBusinessName, setRegBusinessName] = useState("");
  const [regPrimaryCategory, setRegPrimaryCategory] = useState<"Products" | "Industries" | "Services">("Products");
  const [regBusinessTypes, setRegBusinessTypes] = useState<string[]>(["Products"]);
  const [regSelectedCategories, setRegSelectedCategories] = useState<string[]>([]);
  const [regSelectedSubcategories, setRegSelectedSubcategories] = useState<string[]>([]);
  const [regOtherBusinessType, setRegOtherBusinessType] = useState("");
  const [regOtherCategoryEnabled, setRegOtherCategoryEnabled] = useState(false);
  const [regOtherCategoryName, setRegOtherCategoryName] = useState("");
  const [regOtherSubcatByCat, setRegOtherSubcatByCat] = useState<Record<string, { enabled: boolean; text: string }>>({});
  const [regBusinessType, setRegBusinessType] = useState("Manufacturer");
  const [regCustomBusinessType, setRegCustomBusinessType] = useState("");
  const [regBusinessProofType, setRegBusinessProofType] = useState("GST Registration Certificate");
  const [regBusinessProofNumber, setRegBusinessProofNumber] = useState("");
  const [regLegalName, setRegLegalName] = useState("");
  const [regCustomDocType, setRegCustomDocType] = useState("");
  const [regIdProofUrl, setRegIdProofUrl] = useState("");

  // Address Breakdown
  const [regCountry, setRegCountry] = useState("India");
  const [regCity, setRegCity] = useState("");
  const [regState, setRegState] = useState("");
  const [regDoorNo, setRegDoorNo] = useState("");
  const [regAddressLine1, setRegAddressLine1] = useState("");
  const [regAddressLine2, setRegAddressLine2] = useState("");
  const [regPincode, setRegPincode] = useState("");
  const [regDescription, setRegDescription] = useState("");

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [resubmitMode, setResubmitMode] = useState(false);

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

  // Custom "Other" listing state (for sellers who selected Other during onboarding)
  const [otherTitle, setOtherTitle] = useState("");
  const [otherType, setOtherType] = useState<"product" | "machinery" | "service">("product");
  const [otherPrice, setOtherPrice] = useState("");
  const [otherUnit, setOtherUnit] = useState("Unit");
  const [otherAvail, setOtherAvail] = useState("In Stock");
  const [otherDesc, setOtherDesc] = useState("");
  const [otherImage, setOtherImage] = useState("/images/cat-products.png");
  const [publishingOther, setPublishingOther] = useState(false);

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

  // Seller-scoped categories & subcategories (Strict Business Type + Onboarding Selection Filtering)
  const sellerSelectedBusinessTypes: string[] = (() => {
    try {
      const parsed = JSON.parse(vendor?.selected_business_types || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return [vendor?.primary_category || vendor?.business_category || "Products"];
  })();

  const sellerSelectedCatSlugs: string[] = (() => {
    try {
      const parsed = JSON.parse(vendor?.selected_categories || "[]");
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [];
  })();

  const sellerSelectedSubSlugs: string[] = (() => {
    try {
      const parsed = JSON.parse(vendor?.selected_subcategories || "[]");
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [];
  })();

  const sellerOtherCats: string[] = (() => {
    try {
      const parsed = JSON.parse(vendor?.other_categories || "[]");
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [];
  })();

  const sellerOtherSubs: string[] = (() => {
    try {
      const parsed = JSON.parse(vendor?.other_subcategories || "[]");
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [];
  })();

  const allowedSellerTypes = new Set(
    sellerSelectedBusinessTypes.flatMap((bt) => {
      const l = bt.toLowerCase();
      if (l.includes("product")) return ["product"];
      if (l.includes("machinery") || l.includes("industr")) return ["machinery"];
      if (l.includes("service")) return ["service"];
      return [];
    })
  );

  const allowedCategories = categories.filter((c) => {
    if (sellerSelectedCatSlugs.length > 0) {
      return sellerSelectedCatSlugs.includes(c.slug);
    }
    if (allowedSellerTypes.size > 0) {
      return allowedSellerTypes.has(c.type);
    }
    return true;
  });

  // Filter subcategories by chosen category AND seller's selected subcategories (if any)
  const filteredSubcategories = subcategories.filter((s) => {
    const matchesCat =
      s.category_name?.toLowerCase() === stepCategory.toLowerCase() ||
      (s as { category_slug?: string }).category_slug === stepCategory;
    if (!matchesCat) return false;
    if (sellerSelectedSubSlugs.length > 0) {
      const subsInCat = subcategories.filter(
        (sub) =>
          sub.category_name?.toLowerCase() === stepCategory.toLowerCase() ||
          (sub as { category_slug?: string }).category_slug === stepCategory
      );
      const sellerPickedInThisCat = subsInCat.some((sub) => sellerSelectedSubSlugs.includes(sub.slug));
      if (sellerPickedInThisCat) {
        return sellerSelectedSubSlugs.includes(s.slug);
      }
    }
    return true;
  });

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

  // Submit Registration
  async function handleRegisterSeller(e: React.FormEvent) {
    e.preventDefault();

    if (regBusinessTypes.length === 0) {
      showToast("Please select at least one option under 'What are you selling?'.", "error");
      return;
    }
    if (regBusinessTypes.includes("Other") && !regOtherBusinessType.trim()) {
      showToast("Please enter your custom business / product / service name.", "error");
      return;
    }
    const hasNonOtherType = regBusinessTypes.some((t) => t !== "Other");
    if (hasNonOtherType && regSelectedCategories.length === 0 && (!regOtherCategoryEnabled || !regOtherCategoryName.trim())) {
      showToast("Please select at least one category (or Other) for your business.", "error");
      return;
    }
    // Validate that every selected category with subcategories has >= 1 subcategory or Other selected
    for (const cSlug of regSelectedCategories) {
      const cat = categories.find((c) => c.slug === cSlug);
      if (!cat) continue;
      const catSubs = subcategories.filter(
        (s) => s.category_id === cat.id || (s as { category_slug?: string }).category_slug === cSlug
      );
      if (catSubs.length > 0) {
        const hasCheckedSub = catSubs.some((s) => regSelectedSubcategories.includes(s.slug));
        const otherSub = regOtherSubcatByCat[cSlug];
        const hasOtherSub = Boolean(otherSub?.enabled && otherSub.text.trim());
        if (!hasCheckedSub && !hasOtherSub) {
          showToast(`Please select at least one ${cat.name} subcategory or choose Other.`, "error");
          return;
        }
      }
    }

    if (!regBusinessName.trim()) {
      showToast("Please enter your registered business name.", "error");
      return;
    }
    const effectiveBusinessType =
      regBusinessType === "Other" ? regCustomBusinessType.trim() : regBusinessType;
    if (!effectiveBusinessType) {
      showToast("Please specify your business type.", "error");
      return;
    }

    if (!regDescription.trim()) {
      showToast("Please enter your business requirements / products & services you offer.", "error");
      return;
    }
    if (!regCity.trim() || !regAddressLine1.trim()) {
      showToast("Please enter your city and address line 1.", "error");
      return;
    }
    if (!user && (!regOwnerName.trim() || !regEmail.trim() || regMobile.replace(/\D/g, "").length !== 10 || regPassword.length < 6)) {
      showToast("Please provide your name, valid email, 10-digit mobile, and password (min 6 chars).", "error");
      return;
    }

    setSubmittingReg(true);
    try {
      const fullAddress = [
        regDoorNo.trim(),
        regAddressLine1.trim(),
        regAddressLine2.trim(),
        regCity.trim(),
        regState.trim(),
        regPincode.trim(),
        regCountry.trim(),
      ]
        .filter(Boolean)
        .join(", ");

      const res = await fetch("/api/vendors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: user?.name || regOwnerName.trim(),
          email: user?.email || regEmail.trim(),
          mobile: user?.mobile || regMobile.trim(),
          password: regPassword,
          businessName: regBusinessName.trim(),
          businessType: effectiveBusinessType,
          businessCategory: regBusinessTypes[0] || regPrimaryCategory,
          primaryCategory: regBusinessTypes[0] || regPrimaryCategory,
          selectedBusinessTypes: regBusinessTypes,
          selectedCategories: regSelectedCategories,
          selectedSubcategories: regSelectedSubcategories,
          otherBusinessType: regBusinessTypes.includes("Other") ? regOtherBusinessType.trim() : "",
          otherCategories:
            regOtherCategoryEnabled && regOtherCategoryName.trim()
              ? regOtherCategoryName.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
          otherSubcategories: Object.values(regOtherSubcatByCat)
            .filter((v) => v.enabled && v.text.trim())
            .map((v) => v.text.trim()),
          businessProofType: "Business Requirements",
          businessProofNumber: "",
          gstNumber: "",
          legalName: regBusinessName.trim(),
          productDetails: regDescription.trim(),
          country: regCountry.trim() || "India",
          city: regCity.trim(),
          state: regState.trim(),
          doorNo: regDoorNo.trim(),
          addressLine1: regAddressLine1.trim(),
          addressLine2: regAddressLine2.trim(),
          pincode: regPincode.trim(),
          address: fullAddress,
          description: regDescription.trim(),
          idProofUrl: regIdProofUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Registration failed.", "error");
        return;
      }

      if (data.vendor) {
        setVendor(data.vendor);
      }
      showToast(
        data.message || "Your seller account is approved and active! Welcome to your Seller Dashboard.",
        "success"
      );
      setResubmitMode(false);
      await loadData();
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
  // CASE A & B: SELLER APPLICATION FORM (GUEST OR REGISTERED USER)
  // ==========================================================================
  if (!vendor || resubmitMode) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-[#0a2458] to-[#123983] p-6 sm:p-8 text-white shadow-lg mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316] px-3.5 py-1 text-xs font-black uppercase tracking-wider">
                <Store className="h-3.5 w-3.5" />
                Become a RAWMAT MART Seller
              </span>
              <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold">
                {resubmitMode ? "Resubmit Seller Application" : "Apply as Seller"}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-blue-100 max-w-xl">
                Register as a verified industrial seller. Showcase your products, machineries, and turnkey services to verified bulk buyers across India.
              </p>
            </div>
            {!user && (
              <Link
                href="/seller/login"
                className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white hover:bg-slate-100 text-[#0a2458] px-5 py-2.5 text-xs font-bold shadow transition-all active:scale-95"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Already a Seller? Login</span>
              </Link>
            )}
          </div>
          {user && (
            <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2 text-xs text-blue-200">
              <BadgeCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Common Account Linked: <strong>{user.name}</strong> ({user.email}) • Mobile: <strong>{user.mobile}</strong></span>
            </div>
          )}
        </div>

        {/* Application Form */}
        <form onSubmit={handleRegisterSeller} className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* 1. Account / Owner Information */}
          <div>
            <h3 className="text-sm font-extrabold text-[#0a2458] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-[#0a2458] flex items-center justify-center text-xs font-bold">1</span>
              <span>Owner & Contact Credentials</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Owner / Contact Person Name *</label>
                <input
                  type="text"
                  required
                  value={user ? user.name : regOwnerName}
                  onChange={(e) => setRegOwnerName(e.target.value)}
                  disabled={Boolean(user)}
                  placeholder="e.g. Rajesh Kulkarni"
                  className={`w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none ${
                    user ? "bg-slate-100 text-slate-600 font-medium" : "bg-white"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Business Email *</label>
                <input
                  type="email"
                  required
                  value={user ? user.email : regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={Boolean(user)}
                  placeholder="e.g. sales@company.com"
                  className={`w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none ${
                    user ? "bg-slate-100 text-slate-600 font-medium" : "bg-white"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={user ? user.mobile : regMobile}
                  onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  disabled={Boolean(user)}
                  placeholder="e.g. 9820112233"
                  className={`w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none ${
                    user ? "bg-slate-100 text-slate-600 font-medium" : "bg-white font-mono"
                  }`}
                />
              </div>

              {!user && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Create Seller Account Password *</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">Used for your common buyer/seller account login</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. What are you selling? Dynamic Business Type -> Categories -> Subcategories -> Other */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-[#0a2458] uppercase tracking-wider mb-1 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-blue-100 text-[#0a2458] flex items-center justify-center text-xs font-bold">2</span>
                <span>What are you selling? *</span>
              </h3>
              <p className="text-xs text-slate-500">
                Select what you sell, then pick your exact categories &amp; subcategories. Only your selected categories will appear in your Seller Dashboard.
              </p>
            </div>

            {/* Step 2A: Business Type Multi-Select Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { id: "Products", label: "Products", desc: "Raw materials, Rubber, Plastic, Metals" },
                { id: "Machinery", label: "Machinery", desc: "Industrial & CNC equipment" },
                { id: "Industry", label: "Industry", desc: "Turnkey plants & industrial units" },
                { id: "Services", label: "Services", desc: "AMC, Logistics, Fabrication, Loans" },
                { id: "Other", label: "Other", desc: "Custom product or service" },
              ].map((bt) => {
                const checked = regBusinessTypes.includes(bt.id);
                return (
                  <button
                    key={bt.id}
                    type="button"
                    onClick={() => {
                      setRegBusinessTypes((prev) => {
                        const next = prev.includes(bt.id)
                          ? prev.filter((x) => x !== bt.id)
                          : [...prev, bt.id];
                        if (next[0] === "Products" || next[0] === "Industries" || next[0] === "Services") {
                          setRegPrimaryCategory(next[0] as "Products" | "Industries" | "Services");
                        } else if (next.includes("Machinery") || next.includes("Industry")) {
                          setRegPrimaryCategory("Industries");
                        } else if (next.includes("Services")) {
                          setRegPrimaryCategory("Services");
                        } else {
                          setRegPrimaryCategory("Products");
                        }
                        return next;
                      });
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      checked
                        ? "bg-[#0a2458] text-white border-[#0a2458] shadow-md ring-2 ring-[#f97316]/40"
                        : "bg-slate-50/70 hover:bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-xs sm:text-sm">{bt.label}</span>
                      <span
                        className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          checked ? "border-white bg-[#f97316] text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {checked ? "✓" : ""}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-1 line-clamp-2 ${checked ? "text-blue-100" : "text-slate-500"}`}>
                      {bt.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom Other Business Type input */}
            {regBusinessTypes.includes("Other") && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
                <label className="block text-xs font-bold text-[#0a2458] mb-1">
                  Enter your custom product / service / business category name *
                </label>
                <input
                  type="text"
                  value={regOtherBusinessType}
                  onChange={(e) => setRegOtherBusinessType(e.target.value)}
                  placeholder="e.g. Custom Industrial Conveyor System"
                  className="w-full rounded-xl border border-orange-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
                />
              </div>
            )}

            {/* Step 2B: Dynamic Main Categories based on selected Business Types */}
            {(() => {
              const targetTypes = new Set<string>();
              if (regBusinessTypes.includes("Products")) targetTypes.add("product");
              if (regBusinessTypes.includes("Machinery") || regBusinessTypes.includes("Industry")) {
                targetTypes.add("machinery");
              }
              if (regBusinessTypes.includes("Services")) targetTypes.add("service");

              const dynamicCats = categories.filter((c) => targetTypes.has(c.type));
              if (targetTypes.size === 0) return null;

              return (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0a2458]">
                      Select the main categories you sell *
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Showing categories for: {regBusinessTypes.filter((t) => t !== "Other").join(", ")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {dynamicCats.map((cat) => {
                      const isCatChecked = regSelectedCategories.includes(cat.slug);
                      return (
                        <label
                          key={cat.id}
                          className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-all text-xs font-bold ${
                            isCatChecked
                              ? "bg-blue-50 border-[#1652b8] text-[#0a2458] shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isCatChecked}
                            onChange={() => {
                              setRegSelectedCategories((prev) =>
                                prev.includes(cat.slug) ? prev.filter((x) => x !== cat.slug) : [...prev, cat.slug]
                              );
                            }}
                            className="h-4 w-4 accent-[#0a2458] rounded shrink-0"
                          />
                          <span className="truncate">{cat.name}</span>
                          <span className="ml-auto text-[10px] uppercase text-slate-400 font-semibold">
                            {cat.type === "machinery" ? "Industry" : cat.type}
                          </span>
                        </label>
                      );
                    })}

                    {/* Other Category Checkbox */}
                    <label
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-all text-xs font-bold ${
                        regOtherCategoryEnabled
                          ? "bg-orange-50 border-[#f97316] text-[#0a2458]"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={regOtherCategoryEnabled}
                        onChange={(e) => setRegOtherCategoryEnabled(e.target.checked)}
                        className="h-4 w-4 accent-[#f97316] rounded shrink-0"
                      />
                      <span>Other (Custom Category)</span>
                    </label>
                  </div>

                  {regOtherCategoryEnabled && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Enter your product / service / category name *
                      </label>
                      <input
                        type="text"
                        value={regOtherCategoryName}
                        onChange={(e) => setRegOtherCategoryName(e.target.value)}
                        placeholder="e.g. Custom Industrial Conveyor System"
                        className="w-full rounded-xl border border-orange-200 bg-white px-3.5 py-2 text-sm focus:border-[#0a2458] focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Step 2C: Dynamic Subcategories for each checked Main Category */}
                  {regSelectedCategories.map((cSlug) => {
                    const cat = dynamicCats.find((c) => c.slug === cSlug);
                    if (!cat) return null;
                    const catSubs = subcategories.filter(
                      (s) => s.category_id === cat.id || (s as { category_slug?: string }).category_slug === cSlug
                    );
                    const otherState = regOtherSubcatByCat[cSlug] || { enabled: false, text: "" };

                    return (
                      <div key={cat.id} className="rounded-xl border border-blue-100 bg-white p-3.5 space-y-2.5">
                        <div className="text-xs font-extrabold text-[#0a2458]">
                          {cat.name} Subcategories
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {catSubs.map((sub) => {
                            const isSubChecked = regSelectedSubcategories.includes(sub.slug);
                            return (
                              <label
                                key={sub.id}
                                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 cursor-pointer text-xs font-semibold ${
                                  isSubChecked
                                    ? "bg-[#0a2458] text-white border-[#0a2458]"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSubChecked}
                                  onChange={() => {
                                    setRegSelectedSubcategories((prev) =>
                                      prev.includes(sub.slug)
                                        ? prev.filter((x) => x !== sub.slug)
                                        : [...prev, sub.slug]
                                    );
                                  }}
                                  className="h-3.5 w-3.5 accent-[#f97316]"
                                />
                                <span>{sub.name}</span>
                              </label>
                            );
                          })}
                          <label
                            className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 cursor-pointer text-xs font-semibold ${
                              otherState.enabled
                                ? "bg-orange-500 text-white border-orange-500"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={otherState.enabled}
                              onChange={(e) =>
                                setRegOtherSubcatByCat((prev) => ({
                                  ...prev,
                                  [cSlug]: { enabled: e.target.checked, text: prev[cSlug]?.text || "" },
                                }))
                              }
                              className="h-3.5 w-3.5 accent-white"
                            />
                            <span>Other</span>
                          </label>
                        </div>
                        {otherState.enabled && (
                          <input
                            type="text"
                            value={otherState.text}
                            onChange={(e) =>
                              setRegOtherSubcatByCat((prev) => ({
                                ...prev,
                                [cSlug]: { enabled: true, text: e.target.value },
                              }))
                            }
                            placeholder={`Enter your custom ${cat.name} product / subcategory name...`}
                            className="w-full rounded-lg border border-orange-200 bg-orange-50/40 px-3 py-2 text-xs focus:border-[#0a2458] focus:outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* 3. Business Name & Business Type */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-extrabold text-[#0a2458] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-[#0a2458] flex items-center justify-center text-xs font-bold">3</span>
              <span>Business Profile</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Registered Business Name *</label>
                <input
                  type="text"
                  required
                  value={regBusinessName}
                  onChange={(e) => setRegBusinessName(e.target.value)}
                  placeholder="e.g. Bharat Rubber & Polymers Pvt Ltd"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Business Type *</label>
                <select
                  value={regBusinessType}
                  onChange={(e) => setRegBusinessType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium focus:border-[#0a2458] focus:outline-none"
                >
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Bulk Supplier">Bulk Supplier</option>
                  <option value="Manufacturer & Bulk Supplier">Manufacturer & Bulk Supplier</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Trader">Trader</option>
                  <option value="Service Provider">Service Provider</option>
                  <option value="Industrial Machinery Supplier">Industrial Machinery Supplier</option>
                  <option value="Other">Other</option>
                </select>
                {regBusinessType === "Other" && (
                  <input
                    type="text"
                    required
                    value={regCustomBusinessType}
                    onChange={(e) => setRegCustomBusinessType(e.target.value)}
                    placeholder="Specify your business type..."
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm focus:border-[#0a2458] focus:outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 4. Business Requirements & Supply Details */}
          <div className="border-t border-slate-100 pt-5">
            <h3 className="text-sm font-extrabold text-[#0a2458] uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-[#0a2458] flex items-center justify-center text-xs font-bold">4</span>
              <span>Business Requirements *</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Tell us about your business requirements, products, machineries, or services you wish to list or supply:
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Requirements / Products & Services Details *
              </label>
              <textarea
                rows={4}
                required
                value={regDescription}
                onChange={(e) => setRegDescription(e.target.value)}
                placeholder="e.g. Supplying bulk HDPE granules, EPDM rubber sheets, industrial machineries, or AMC services across India..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
              />
            </div>
          </div>

          {/* 5. Address Breakdown: City, Country, Down Full Address */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h3 className="text-sm font-extrabold text-[#0a2458] uppercase tracking-wider flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-[#0a2458] flex items-center justify-center text-xs font-bold">5</span>
              <span>Factory / Business Address & Location</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Country *</label>
                <input
                  type="text"
                  required
                  value={regCountry}
                  onChange={(e) => setRegCountry(e.target.value)}
                  placeholder="India"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">City *</label>
                <input
                  type="text"
                  required
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  placeholder="e.g. Hyderabad / Mumbai"
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
                  placeholder="e.g. Telangana / Maharashtra"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Door No / Shop No / Unit No *</label>
                <input
                  type="text"
                  required
                  value={regDoorNo}
                  onChange={(e) => setRegDoorNo(e.target.value)}
                  placeholder="e.g. Shop No. 12 / Plot No. 45-B"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pincode / Postal Code *</label>
                <input
                  type="text"
                  required
                  value={regPincode}
                  onChange={(e) => setRegPincode(e.target.value)}
                  placeholder="e.g. 500037"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Address Line 1 (Street / Industrial Area / Estate) *</label>
              <input
                type="text"
                required
                value={regAddressLine1}
                onChange={(e) => setRegAddressLine1(e.target.value)}
                placeholder="e.g. Phase 2, IDA Industrial Estate, Main Road"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Address Line 2 (Landmark / Area / Phase)</label>
              <input
                type="text"
                value={regAddressLine2}
                onChange={(e) => setRegAddressLine2(e.target.value)}
                placeholder="e.g. Near Industrial Substation / Beside Warehouse"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
              />
            </div>
          </div>

          {/* 6. Description */}
          <div className="border-t border-slate-100 pt-5">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Business & Product Capabilities Description</label>
            <textarea
              rows={3}
              value={regDescription}
              onChange={(e) => setRegDescription(e.target.value)}
              placeholder="Certifications, years in business, monthly production capacity, client references..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-[#0a2458] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submittingReg}
            className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-60 text-white py-4 text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {submittingReg ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Store className="h-5 w-5" />
                <span>Submit Seller Business Registration for Verification</span>
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
            Your seller application is currently under admin verification. Please wait for approval.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-amber-900 max-w-xl mx-auto leading-relaxed">
            Your seller application for <strong>{vendor.business_name}</strong> is under review by our Super Admin team. You will be notified via email once approved.
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
            Your seller application has been declined. Please check your application status or contact support.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-rose-900 max-w-xl mx-auto leading-relaxed">
            Your seller application has not been approved. Please contact RAWMAT MART support for further information.
          </p>
          {vendor.rejection_reason && (
            <div className="mt-4 rounded-2xl bg-white border border-rose-200 p-4 text-xs text-rose-800 max-w-lg mx-auto">
              <strong>Admin Remarks:</strong> {vendor.rejection_reason}
            </div>
          )}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setResubmitMode(true)}
              className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-6 py-2.5 text-xs font-bold shadow"
            >
              Revise & Resubmit Application
            </button>
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
  // CASE F: DEACTIVATED / SUSPENDED SELLER
  // ==========================================================================
  if (vendor.verification_status === "suspended") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="rounded-3xl bg-slate-100 border-2 border-slate-300 p-6 sm:p-10 shadow-lg text-center">
          <ShieldAlert className="h-14 w-14 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Your Seller Account Is Currently Deactivated
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-700 max-w-xl mx-auto leading-relaxed">
            Your RAWMAT MART seller account for <strong>{vendor.business_name}</strong> has been deactivated by the administrator. Your public listings are hidden and publishing is disabled.
          </p>
          {vendor.rejection_reason && (
            <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-4 text-xs text-slate-700 max-w-lg mx-auto">
              <strong>Remarks:</strong> {vendor.rejection_reason}
            </div>
          )}
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
                Your Seller Account Has Been Approved!
              </span>
              <span className="rounded-full bg-[#f97316] px-3 py-0.5 text-xs font-bold uppercase">
                {vendor.business_category}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
              {vendor.business_name}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl leading-relaxed">
              Congratulations! Your RAWMAT MART Vendor Account has been approved. Kindly start listing your products and services.
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

          {/* My Business & Selected Categories Card */}
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 p-5 sm:p-6 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-[#0a2458]">
                My Business &amp; Selected Categories
              </h2>
              <span className="rounded-full bg-blue-100 text-[#1652b8] px-3 py-0.5 text-[11px] font-extrabold uppercase">
                {sellerSelectedBusinessTypes.join(" • ")}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase block mb-1">My Categories</span>
                <div className="flex flex-wrap gap-1.5">
                  {allowedCategories.length > 0 ? (
                    allowedCategories.map((c) => (
                      <span key={c.id} className="rounded-full bg-[#0a2458] text-white px-2.5 py-1 text-[11px] font-bold">
                        {c.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">None selected</span>
                  )}
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-400 uppercase block mb-1">My Subcategories</span>
                <div className="flex flex-wrap gap-1.5">
                  {sellerSelectedSubSlugs.length > 0 ? (
                    sellerSelectedSubSlugs.map((slug) => {
                      const subObj = subcategories.find((s) => s.slug === slug);
                      return (
                        <span key={slug} className="rounded-full bg-orange-100 text-[#ea580c] px-2.5 py-1 text-[11px] font-bold">
                          {subObj?.name || slug}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-slate-500">All subcategories under selected categories</span>
                  )}
                </div>
              </div>
              {(vendor.other_business_type || sellerOtherCats.length > 0 || sellerOtherSubs.length > 0) && (
                <div>
                  <span className="font-bold text-slate-400 uppercase block mb-1">Other Custom Products</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[vendor.other_business_type, ...sellerOtherCats, ...sellerOtherSubs]
                      .filter(Boolean)
                      .map((item, idx) => (
                        <span key={idx} className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-bold">
                          {item}
                        </span>
                      ))}
                  </div>
                </div>
              )}
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
                  <option value="">-- Choose From Your Selected Categories --</option>
                  {allowedCategories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name} ({c.type === "machinery" ? "Industry / Machinery" : c.type})
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

          {(sellerSelectedBusinessTypes.includes("Other") ||
            sellerOtherCats.length > 0 ||
            sellerOtherSubs.length > 0 ||
            vendor.other_business_type) && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!otherTitle.trim() || !otherPrice || Number(otherPrice) <= 0) {
                  showToast("Enter your custom product name and a valid selling price.", "error");
                  return;
                }
                setPublishingOther(true);
                try {
                  const res = await fetch("/api/vendor/listings", {
                    method: "POST",
                    cache: "no-store",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      is_other_custom: true,
                      type: otherType,
                      category_slug: "other",
                      subcategory_slug: "other",
                      title: otherTitle.trim(),
                      price_numeric: Number(otherPrice),
                      price_unit: otherUnit,
                      availability: otherAvail,
                      location: vendor.city || "Pan India",
                      description: otherDesc.trim() || otherTitle.trim(),
                      image_url: otherImage,
                    }),
                  });
                  const out = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    showToast(out.error || "Failed to publish custom product.", "error");
                    return;
                  }
                  showToast(out.message || "Custom product published live!", "success");
                  setOtherTitle("");
                  setOtherPrice("");
                  setOtherDesc("");
                  await loadSellerDetails();
                  setActiveTab("listings");
                } finally {
                  setPublishingOther(false);
                }
              }}
              className="mt-8 pt-6 border-t border-slate-200 space-y-4"
            >
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 text-[#f97316] px-3 py-1 text-[11px] font-extrabold uppercase">
                  Other / Custom Products
                </span>
                <h3 className="text-base font-extrabold text-[#0a2458] mt-1">
                  Publish Your Custom &ldquo;Other&rdquo; Product / Service
                </h3>
                <p className="text-xs text-slate-500">
                  Selected during onboarding: {[vendor.other_business_type, ...sellerOtherCats, ...sellerOtherSubs].filter(Boolean).join(", ") || "Other"}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <input
                  value={otherTitle}
                  onChange={(e) => setOtherTitle(e.target.value)}
                  placeholder="Custom Product / Service Name *"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#0a2458]"
                />
                <select
                  value={otherType}
                  onChange={(e) => setOtherType(e.target.value as "product" | "machinery" | "service")}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 bg-white outline-none focus:border-[#0a2458]"
                >
                  <option value="product">Product</option>
                  <option value="machinery">Machinery / Industry</option>
                  <option value="service">Service</option>
                </select>
                <input
                  type="number"
                  min="1"
                  value={otherPrice}
                  onChange={(e) => setOtherPrice(e.target.value)}
                  placeholder="Selling Price (₹) *"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#0a2458]"
                />
                <select
                  value={otherUnit}
                  onChange={(e) => setOtherUnit(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 bg-white outline-none focus:border-[#0a2458]"
                >
                  <option value="Unit">Per Unit</option>
                  <option value="Kg">Per Kg</option>
                  <option value="Ton">Per Ton</option>
                  <option value="Project">Per Project</option>
                </select>
                <select
                  value={otherAvail}
                  onChange={(e) => setOtherAvail(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 bg-white outline-none focus:border-[#0a2458]"
                >
                  <option value="In Stock">In Stock</option>
                  <option value="Made to Order">Made to Order</option>
                </select>
                <input
                  value={otherImage}
                  onChange={(e) => setOtherImage(e.target.value)}
                  placeholder="Image URL (optional)"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#0a2458]"
                />
                <input
                  value={otherDesc}
                  onChange={(e) => setOtherDesc(e.target.value)}
                  placeholder="Description & specifications"
                  className="sm:col-span-2 rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#0a2458]"
                />
              </div>
              <button
                type="submit"
                disabled={publishingOther}
                className="rounded-full bg-[#0a2458] hover:bg-[#123983] text-white px-5 py-2.5 text-xs font-extrabold shadow"
              >
                {publishingOther ? "Publishing..." : "+ Publish Custom Product"}
              </button>
            </form>
          )}
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
          <div className="mt-6">
            <ChangePasswordCard />
          </div>
        </div>
      )}
    </div>
  );
}
