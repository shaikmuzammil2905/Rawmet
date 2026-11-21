"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  Cog,
  CreditCard,
  Download,
  Edit2,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  FileUp,
  Filter,
  FolderTree,
  Gift,
  Globe,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Package,
  Plus,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Store,
  Tag,
  Trash2,
  Users,
  Wrench,
  X,
} from "lucide-react";
import type {
  AboutContent,
  AuditLogRecord,
  CategoryRecord,
  ContactSettings,
  HeroSlide,
  LaunchingOfferContent,
  ListingRecord,
  RequirementRecord,
  SubcategoryRecord,
  SubscriptionFormRecord,
  SubscriptionPlanRecord,
  UserRecord,
  VendorRecord,
} from "@/lib/types";
import { useToast } from "./ToastProvider";
import {
  AdminCategoriesPanel,
  AdminCmsEditor,
  AdminGalleryPanel,
  AdminPlansPanel,
} from "./AdminCmsPanels";

interface AdminOverviewData {
  kpi: {
    totalUsers: number;
    totalRegisteredSellers: number;
    totalRegisteredBuyers: number;
    activeSellers: number;
    activeBuyers: number;
    totalVendors: number;
    activeVendors: number;
    pendingVendors: number;
    rejectedVendors: number;
    totalListings: number;
    approvedListings: number;
    pendingListings: number;
    rejectedListings: number;
    totalProducts: number;
    approvedProducts: number;
    pendingProducts: number;
    rejectedProducts: number;
    totalMachineryListings: number;
    totalServiceListings: number;
    totalRequirements: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    totalRevenueInr: number;
    totalVerifiedPayments: number;
    pendingPayments: number;
    pendingFormsCount: number;
  };
  categoryBreakdown: Array<{ type: string; count: number }>;
  vendors: VendorRecord[];
  users: UserRecord[];
  listings: ListingRecord[];
  categories: CategoryRecord[];
  subcategories: SubcategoryRecord[];
  requirements: RequirementRecord[];
  enquiries: Array<{
    id: number;
    name: string;
    mobile: string;
    message: string;
    listing_title: string;
    vendor_name: string;
    status: string;
  }>;
  subscriptions: Array<{
    id: number;
    user_name: string;
    user_mobile: string;
    plan_name: string;
    price_inr: number;
    status: string;
    ends_at: string;
  }>;
  payments: Array<{
    id: number;
    order_id: string;
    user_name: string;
    plan_name: string;
    amount_inr: number;
    status: string;
    invoice_number: string;
    created_at?: string;
  }>;
  gallery: Array<{ id: number; title: string; category: string; image_url: string; caption: string }>;
  whatsappNotifications: Array<{
    id: number;
    vendor_name: string;
    vendor_whatsapp: string;
    category_slug: string;
    message_preview: string;
    created_at: string;
  }>;
  referrals: Array<{
    id: number;
    name: string;
    mobile: string;
    location: string;
    reference_details: string;
    referral_code: string;
    status: string;
    reward_note: string;
  }>;
  subscriptionForms?: SubscriptionFormRecord[];
  auditLogs?: AuditLogRecord[];
  plans: SubscriptionPlanRecord[];
  cms: {
    heroSlides: HeroSlide[];
    aboutContent: AboutContent;
    launchingOffer: LaunchingOfferContent;
    contactSettings: ContactSettings;
  };
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Core" },
  { id: "subscription_forms", label: "Subscription Forms", icon: ClipboardList, group: "Core" },
  { id: "vendors", label: "Vendors", icon: Store, group: "Core" },
  { id: "users", label: "Users", icon: Users, group: "Core" },
  { id: "products", label: "Products", icon: Package, group: "Catalog" },
  { id: "machineries", label: "Machineries", icon: Cog, group: "Catalog" },
  { id: "services", label: "Services", icon: Wrench, group: "Catalog" },
  { id: "categories", label: "Categories", icon: FolderTree, group: "Catalog" },
  { id: "requirements", label: "Requirements", icon: FileText, group: "Operations" },
  { id: "enquiries", label: "Enquiries", icon: MessageSquare, group: "Operations" },
  { id: "subscriptions", label: "Subscriptions", icon: Tag, group: "Operations" },
  { id: "payments", label: "Payments", icon: CreditCard, group: "Operations" },
  { id: "reports", label: "Reports & Exports", icon: Download, group: "Analytics" },
  { id: "audit_logs", label: "Audit Logs", icon: FileSpreadsheet, group: "Analytics" },
  { id: "offers", label: "Offers", icon: Gift, group: "CMS" },
  { id: "gallery", label: "Gallery", icon: ImageIcon, group: "CMS" },
  { id: "about", label: "About Us", icon: Info, group: "CMS" },
  { id: "content", label: "Website Content", icon: Globe, group: "CMS" },
  { id: "whatsapp", label: "WhatsApp Alerts", icon: MessageCircle, group: "Operations" },
  { id: "referrals", label: "Promote / Referrals", icon: BarChart3, group: "Operations" },
  { id: "settings", label: "Settings", icon: Settings, group: "CMS" },
] as const;

type DateFilter = "all" | "today" | "yesterday" | "7d" | "30d" | "month";

function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) {
    alert("No records to export.");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          let val = row[h];
          if (val === null || val === undefined) val = "";
          if (typeof val === "object") val = JSON.stringify(val);
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function AdminDashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? (searchParams.get("tab") as (typeof NAV_ITEMS)[number]["id"] | null) : null;

  const { showToast } = useToast();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof NAV_ITEMS)[number]["id"]>(
    tabParam && NAV_ITEMS.some((n) => n.id === tabParam) ? tabParam : "dashboard"
  );
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  useEffect(() => {
    if (tabParam && NAV_ITEMS.some((n) => n.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Rejection modal
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    type: "vendor" | "listing";
    id: number;
    reason: string;
  }>({
    isOpen: false,
    type: "vendor",
    id: 0,
    reason: "",
  });

  // Subscription Forms filter
  const [formStatusFilter, setFormStatusFilter] = useState<string>("all");

  // Quick Add listing state
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newPrice, setNewPrice] = useState("Request Quote");
  const [newLoc, setNewLoc] = useState("Hyderabad, Telangana");
  const [newShort, setNewShort] = useState("");
  const [newFullDesc, setNewFullDesc] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("/images/cat-products.png");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Edit Listing Modal state
  const [editingListing, setEditingListing] = useState<ListingRecord | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCat, setEditCat] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editLoc, setEditLoc] = useState("");
  const [editShort, setEditShort] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editUploading, setEditUploading] = useState(false);

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview");
      if (res.status === 401 || res.status === 403) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        showToast("Unable to load overview data from server.", "error");
        return;
      }
      const d = await res.json();
      if (!d || !d.kpi) {
        showToast(d?.error || "Invalid overview data.", "error");
        return;
      }
      setData(d);
    } catch (err) {
      console.error("Dashboard loadOverview error:", err);
      showToast("Network error loading dashboard.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  async function handleS3Upload(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    setLoadingState: (loading: boolean) => void
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoadingState(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const out = await res.json();
      if (res.ok && out.url) {
        setter(out.url);
        showToast("Image uploaded to S3 storage successfully!", "success");
      } else {
        showToast(out.error || "Image upload failed.", "error");
      }
    } catch {
      showToast("Network error uploading file.", "error");
    } finally {
      setLoadingState(false);
    }
  }

  async function updateVendor(
    vendorId: number,
    verificationStatus: "approved" | "rejected" | "suspended",
    rejectionReason?: string
  ) {
    const res = await fetch("/api/admin/vendors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId, verificationStatus, rejectionReason }),
    });
    if (res.ok) {
      showToast(`Vendor marked ${verificationStatus}.`, "success");
      loadOverview();
    }
  }

  async function updateListing(id: number, payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
    if (res.ok) {
      showToast("Listing updated live on website!", "success");
      loadOverview();
    }
  }

  async function saveEditedListing(e: React.FormEvent) {
    e.preventDefault();
    if (!editingListing) return;
    const res = await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingListing.id,
        title: editTitle,
        category_slug: editCat,
        price_display: editPrice,
        location: editLoc,
        short_description: editShort,
        description: editDesc,
        image_url: editImage,
      }),
    });
    if (res.ok) {
      showToast("Listing changes saved and live on website!", "success");
      setEditingListing(null);
      loadOverview();
    } else {
      showToast("Failed to save listing changes.", "error");
    }
  }

  async function deleteListing(id: number) {
    if (!confirm("Are you sure you want to permanently delete this listing from the database and website?"))
      return;
    await fetch(`/api/admin/listings?id=${id}`, { method: "DELETE" });
    showToast("Listing deleted.", "info");
    loadOverview();
  }

  async function addAdminListing(type: "product" | "machinery" | "service", e: React.FormEvent) {
    e.preventDefault();
    const fallbackCat =
      data?.categories.find((c) => c.type === type)?.slug ||
      (type === "product" ? "rubber" : type === "machinery" ? "rubber-machineries" : "amc");
    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        category_slug: newCat || fallbackCat,
        title: newTitle,
        short_description: newShort || newTitle,
        description: newFullDesc || newShort || newTitle,
        price_display: newPrice,
        location: newLoc,
        image_url: newImageUrl,
        status: "approved",
      }),
    });
    if (res.ok) {
      showToast("Listing published directly live on main website!", "success");
      setNewTitle("");
      setNewShort("");
      setNewFullDesc("");
      setNewImageUrl("/images/cat-products.png");
      loadOverview();
    }
  }

  async function updateSubscriptionForm(id: number, status: string, adminRemarks?: string) {
    const res = await fetch("/api/subscription-forms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, admin_remarks: adminRemarks }),
    });
    if (res.ok) {
      showToast(`Subscription Form marked as ${status}.`, "success");
      loadOverview();
    } else {
      showToast("Failed to update subscription form.", "error");
    }
  }

  async function runAction(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/actions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const out = await res.json();
    if (res.ok) {
      showToast(
        typeof out.matchedVendors === "number"
          ? `Dispatched WhatsApp alerts to ${out.matchedVendors} matching vendor(s)!`
          : "Action completed!",
        "success"
      );
      loadOverview();
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (loading || !data || !data.kpi) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-[#0a2458] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-[#0a2458]">Loading Super Admin Control Center...</p>
        {!loading && (!data || !data.kpi) && (
          <button
            onClick={loadOverview}
            className="rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold px-5 py-2 mt-2 shadow transition-all"
          >
            Retry Loading Dashboard
          </button>
        )}
      </div>
    );
  }

  const listingTypeFilter =
    activeTab === "products" ? "product" : activeTab === "machineries" ? "machinery" : "service";

  const filteredForms = (data.subscriptionForms || []).filter((f) =>
    formStatusFilter === "all" ? true : f.status === formStatusFilter
  );

  const currentNav = NAV_ITEMS.find((n) => n.id === activeTab);
  const CurrentIcon = currentNav?.icon || LayoutDashboard;

  // Group items for mobile menu drawer
  const groupedNav = {
    Core: NAV_ITEMS.filter((n) => n.group === "Core"),
    Catalog: NAV_ITEMS.filter((n) => n.group === "Catalog"),
    CMS: NAV_ITEMS.filter((n) => n.group === "CMS"),
    Operations: NAV_ITEMS.filter((n) => n.group === "Operations"),
    Analytics: NAV_ITEMS.filter((n) => n.group === "Analytics"),
  };

  return (
    <div className="mx-auto max-w-[1600px] px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <header className="rounded-3xl bg-[#06183d] text-white p-4 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl border border-blue-900/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-[#f97316] flex items-center justify-center shadow-lg shrink-0">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black">RAWMAT MART Super Admin</h1>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 border border-emerald-500/30">
                Live
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5 hidden sm:block">
              Centralized CMS, Vendor Verifications, AWS S3 Pipeline & Subscriptions Management
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Link
            href="/"
            className="rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold px-3.5 py-1.5 transition-colors"
          >
            Website
          </Link>
          <button
            onClick={loadOverview}
            className="rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold px-3.5 py-1.5 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-xs font-bold px-4 py-1.5 shadow transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* MOBILE SECTION BAR: Shown ONLY on mobile (< lg) */}
      <div className="lg:hidden space-y-2">
        <div className="flex items-center justify-between bg-[#0a2458] text-white p-3.5 rounded-2xl shadow-lg border border-blue-900/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-[#f97316] flex items-center justify-center shadow shrink-0">
              <CurrentIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-blue-300 block">Active Section</span>
              <p className="font-black text-sm text-white truncate">{currentNav?.label}</p>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#f97316] hover:bg-[#ea580c] active:scale-95 text-white px-4 py-2 text-xs font-black shadow-lg shadow-orange-500/30 transition-all shrink-0"
          >
            <Menu className="h-4 w-4" />
            <span>Menu ({NAV_ITEMS.length})</span>
          </button>
        </div>

        {/* Quick Swipeable Horizontal Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {(
            [
              { id: "dashboard", label: "Dashboard" },
              { id: "subscription_forms", label: "Forms", badge: data.kpi?.pendingFormsCount },
              { id: "products", label: "Products" },
              { id: "machineries", label: "Machinery" },
              { id: "services", label: "Services" },
              { id: "vendors", label: "Vendors", badge: data.kpi?.pendingVendors },
              { id: "categories", label: "Categories" },
              { id: "content", label: "Hero CMS" },
              { id: "gallery", label: "Gallery" },
              { id: "offers", label: "Offers" },
              { id: "settings", label: "Settings" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shadow-sm ${
                activeTab === item.id
                  ? "bg-[#f97316] text-white shadow-orange-500/20"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              <span>{item.label}</span>
              {"badge" in item && item.badge ? (
                <span className="h-4 min-w-4 rounded-full bg-rose-500 text-white text-[10px] font-black px-1 flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Desktop Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Navigation Sidebar: HIDDEN on mobile, SHOWN on desktop (lg:block) */}
        <aside className="hidden lg:block lg:col-span-1 rounded-3xl bg-[#0a2458] p-4 text-white space-y-1 shadow-lg h-fit max-h-[85vh] overflow-y-auto sticky top-20">
          <p className="text-[10px] font-black uppercase text-blue-300 px-3 py-1 tracking-wider">
            Control Center
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isForms = item.id === "subscription_forms";
            const formsBadge = isForms && (data.kpi?.pendingFormsCount || 0) > 0;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-left transition-colors ${
                  activeTab === item.id
                    ? "bg-[#f97316] text-white shadow font-bold"
                    : "text-blue-100 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {formsBadge && (
                  <span className="rounded-full bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2">
                    {data.kpi?.pendingFormsCount}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Content View: Always full width on mobile! */}
        <main className="lg:col-span-4 space-y-4 sm:space-y-6">
          {/* Action / Title Bar with Date Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#0a2458] flex items-center gap-2">
                <CurrentIcon className="h-5 w-5 text-[#f97316] hidden sm:inline" />
                <span>{currentNav?.label}</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Live database synchronization • RAWMAT MART Industrial Portal
              </span>
            </div>

            {/* Date Range Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-semibold overflow-x-auto max-w-full">
              <span className="text-slate-400 pl-2 pr-1 flex items-center gap-1 text-[11px]">
                <Calendar className="h-3.5 w-3.5" />
                <span>Filter:</span>
              </span>
              {(
                [
                  { id: "all", label: "All Time" },
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "7d", label: "7 Days" },
                  { id: "30d", label: "30 Days" },
                  { id: "month", label: "This Month" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDateFilter(f.id)}
                  className={`rounded-xl px-2.5 py-1 text-xs transition-colors whitespace-nowrap ${
                    dateFilter === f.id
                      ? "bg-[#0a2458] text-white shadow"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Granular KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: "Total Sellers", value: data.kpi.totalRegisteredSellers, color: "text-[#0a2458]" },
                  { label: "Active Approved Sellers", value: data.kpi.activeSellers, color: "text-emerald-600" },
                  { label: "Pending Sellers", value: data.kpi.pendingVendors, color: "text-amber-600" },
                  { label: "Total Registered Buyers", value: data.kpi.totalRegisteredBuyers, color: "text-[#0a2458]" },
                  { label: "Total Products", value: data.kpi.totalProducts, color: "text-[#1652b8]" },
                  { label: "Approved Products", value: data.kpi.approvedProducts, color: "text-emerald-600" },
                  { label: "Pending Products", value: data.kpi.pendingProducts, color: "text-amber-600" },
                  { label: "Machinery Listings", value: data.kpi.totalMachineryListings, color: "text-[#0a2458]" },
                  { label: "Service Listings", value: data.kpi.totalServiceListings, color: "text-[#0a2458]" },
                  { label: "Live Requirements", value: data.kpi.totalRequirements, color: "text-[#0a2458]" },
                  { label: "Active Subscriptions", value: data.kpi.activeSubscriptions, color: "text-emerald-600" },
                  { label: "Expired Subscriptions", value: data.kpi.expiredSubscriptions, color: "text-slate-400" },
                  { label: "Subscription Forms", value: data.kpi.pendingFormsCount, color: "text-orange-600" },
                  { label: "Verified Payments", value: data.kpi.totalVerifiedPayments, color: "text-emerald-600" },
                  { label: "Pending Payments", value: data.kpi.pendingPayments, color: "text-amber-600" },
                  {
                    label: "Total Revenue",
                    value: `₹${data.kpi.totalRevenueInr.toLocaleString("en-IN")}`,
                    color: "text-[#f97316] font-black",
                  },
                ].map((k) => (
                  <div key={k.label} className="rounded-2xl bg-white border border-slate-200 p-3.5 sm:p-4 shadow-sm">
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase text-slate-500">{k.label}</p>
                    <p className={`text-xl sm:text-2xl font-extrabold mt-1 ${k.color}`}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Visual Distribution Chart */}
              <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm">
                <h3 className="text-base font-extrabold text-[#0a2458] mb-4">
                  Marketplace Catalog Distribution
                </h3>
                <div className="space-y-3">
                  {data.categoryBreakdown.map((b) => {
                    const pct =
                      data.kpi.totalListings > 0
                        ? Math.round((b.count / data.kpi.totalListings) * 100)
                        : 0;
                    return (
                      <div key={b.type} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold capitalize">
                          <span className="text-[#0a2458]">{b.type}</span>
                          <span className="text-slate-600">
                            {b.count} listings ({pct}%)
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              b.type === "product"
                                ? "bg-[#0a2458]"
                                : b.type === "machinery"
                                ? "bg-[#1652b8]"
                                : "bg-[#f97316]"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBSCRIPTION FORMS */}
          {activeTab === "subscription_forms" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">Status:</span>
                  {(["all", "pending", "approved", "rejected", "converted"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFormStatusFilter(s)}
                      className={`rounded-xl px-2.5 py-1 text-xs font-bold uppercase transition-colors ${
                        formStatusFilter === s
                          ? "bg-[#0a2458] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Total Forms: {filteredForms.length}
                </span>
              </div>

              <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 overflow-x-auto shadow-sm">
                <table className="w-full text-xs text-left min-w-[650px]">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b">
                    <tr>
                      <th className="p-3">ID / Date</th>
                      <th className="p-3">Applicant Name</th>
                      <th className="p-3">Business</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Plan / Fee</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredForms.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-600">
                          #{f.id}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {f.created_at?.slice(0, 10)}
                          </div>
                        </td>
                        <td className="p-3 font-bold text-[#0a2458]">{f.name}</td>
                        <td className="p-3 text-slate-700">{f.business_name || "—"}</td>
                        <td className="p-3 font-mono">
                          <div>{f.mobile}</div>
                          {f.email && <div className="text-[11px] text-slate-500">{f.email}</div>}
                        </td>
                        <td className="p-3 uppercase font-bold text-[10px] text-slate-500">
                          {f.user_type}
                        </td>
                        <td className="p-3 font-bold text-emerald-700">
                          ₹{f.amount_inr?.toLocaleString("en-IN")}
                          <div className="text-[10px] text-slate-500 font-normal">{f.plan_name}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                              f.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : f.status === "converted"
                                ? "bg-blue-100 text-blue-800"
                                : f.status === "rejected"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td className="p-3 space-x-1 whitespace-nowrap">
                          {f.status !== "approved" && f.status !== "converted" && (
                            <button
                              onClick={() => updateSubscriptionForm(f.id, "approved")}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 text-[11px] font-bold"
                            >
                              Approve
                            </button>
                          )}
                          {f.status !== "converted" && (
                            <button
                              onClick={() => updateSubscriptionForm(f.id, "converted")}
                              className="rounded-lg bg-[#0a2458] hover:bg-[#06183d] text-white px-2 py-1 text-[11px] font-bold"
                              title="Convert into active user subscription"
                            >
                              Convert
                            </button>
                          )}
                          {f.status !== "rejected" && (
                            <button
                              onClick={() => updateSubscriptionForm(f.id, "rejected")}
                              className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 text-[11px] font-bold"
                            >
                              Reject
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredForms.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-500">
                          No subscription forms match this status filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: VENDORS MANAGEMENT */}
          {activeTab === "vendors" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 overflow-x-auto shadow-sm">
              <table className="w-full text-xs text-left min-w-[650px]">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b">
                  <tr>
                    <th className="p-3">Business</th>
                    <th className="p-3">Owner</th>
                    <th className="p-3">GST Number</th>
                    <th className="p-3">Mobile / WA</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#0a2458]">
                        {v.business_name}
                        <div className="text-[11px] font-normal text-slate-500">{v.city}, {v.state}</div>
                      </td>
                      <td className="p-3 text-slate-700">{v.owner_name}</td>
                      <td className="p-3 font-mono text-[11px]">{v.gst_number || "Awaiting Doc"}</td>
                      <td className="p-3 font-mono">{v.mobile}</td>
                      <td className="p-3 font-semibold uppercase text-slate-600">{v.business_category}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                            v.verification_status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : v.verification_status === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {v.verification_status}
                        </span>
                        {v.rejection_reason && (
                          <div className="text-[10px] text-rose-600 mt-1 max-w-xs">{v.rejection_reason}</div>
                        )}
                      </td>
                      <td className="p-3 space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => updateVendor(v.id, "approved")}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 font-bold text-[11px]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            setRejectModal({
                              isOpen: true,
                              type: "vendor",
                              id: v.id,
                              reason: "GST Certificate / Authentic ID could not be verified.",
                            })
                          }
                          className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 font-bold text-[11px]"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: USERS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 overflow-x-auto shadow-sm">
              <table className="w-full text-xs text-left min-w-[550px]">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#0a2458]">{u.name}</td>
                      <td className="p-3 font-mono">{u.email}</td>
                      <td className="p-3 font-mono">{u.mobile}</td>
                      <td className="p-3 font-bold uppercase text-[10px] text-blue-700">{u.role}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                            u.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 space-x-1.5 whitespace-nowrap">
                        {u.role !== "admin" && (
                          <button
                            onClick={() =>
                              runAction({
                                action: "user_status",
                                id: u.id,
                                status: u.status === "active" ? "suspended" : "active",
                              })
                            }
                            className="rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 px-2 py-1 font-bold text-[11px]"
                          >
                            {u.status === "active" ? "Suspend" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 5: PRODUCTS / MACHINERIES / SERVICES (Full View, Add with S3 Upload, Edit Modal & Delete) */}
          {(activeTab === "products" || activeTab === "machineries" || activeTab === "services") && (
            <div className="space-y-6">
              {/* Add New Listing Card */}
              <form
                onSubmit={(e) => addAdminListing(listingTypeFilter, e)}
                className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-[#0a2458]">
                    <Plus className="h-4 w-4 text-[#f97316]" />
                    <span>Upload New {activeTab.slice(0, -1).toUpperCase()} to Website</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Direct S3 + Instant Live
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Item Title *</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Title / Model Name"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-[#1652b8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Category *</label>
                    <select
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-[#1652b8] focus:outline-none bg-white"
                    >
                      {data.categories
                        .filter((c) => c.type === listingTypeFilter)
                        .map((c) => (
                          <option key={c.id} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Price Display</label>
                    <input
                      type="text"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="e.g. ₹55/Kg, ₹2.5 Lakh"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-[#1652b8] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Location</label>
                    <input
                      type="text"
                      value={newLoc}
                      onChange={(e) => setNewLoc(e.target.value)}
                      placeholder="City, State"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-[#1652b8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Short Description / Specs</label>
                    <input
                      type="text"
                      value={newShort}
                      onChange={(e) => setNewShort(e.target.value)}
                      placeholder="Highlights, grade, MOQ"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-[#1652b8] focus:outline-none"
                    />
                  </div>
                </div>

                {/* S3 Image Upload & Preview */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Listing Image (AWS S3 Upload)</label>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <label className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3.5 py-2 text-xs font-bold cursor-pointer hover:bg-slate-50 bg-slate-100 transition-colors">
                      <FileUp className="h-4 w-4 text-[#f97316]" />
                      <span>{uploadingImage ? "Uploading to AWS S3..." : "Upload Photo (S3)"}</span>
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        onChange={(e) => handleS3Upload(e, setNewImageUrl, setUploadingImage)}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Or paste direct image URL"
                      className="flex-1 min-w-[200px] rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono text-slate-700 bg-white"
                    />
                    {newImageUrl && (
                      <img
                        src={newImageUrl}
                        alt="Preview"
                        className="h-9 w-9 object-cover rounded-lg border border-slate-300 shadow-sm shrink-0"
                      />
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white px-6 py-2.5 text-xs font-black shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Publish & Save Directly Live</span>
                </button>
              </form>

              {/* Past Listings List / Grid (Mobile Card + Desktop Table) */}
              <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[#0a2458] text-base">
                    All Past {activeTab.toUpperCase()} Listings (
                    {data.listings.filter((l) => l.type === listingTypeFilter).length})
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">Editable • Live synchronized</span>
                </div>

                {/* Mobile View: High-Density Responsive Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3.5">
                  {data.listings
                    .filter((l) => l.type === listingTypeFilter)
                    .map((l) => (
                      <div
                        key={l.id}
                        className="rounded-2xl border border-slate-200 p-3.5 bg-white shadow-sm flex flex-col justify-between space-y-2.5"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={l.image_url}
                            alt={l.title}
                            className="h-14 w-14 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] uppercase font-bold text-[#f97316] bg-orange-50 px-1.5 py-0.5 rounded">
                              {l.category_slug}
                            </span>
                            <h4 className="font-bold text-xs text-[#0a2458] mt-1 leading-snug line-clamp-2">
                              {l.title}
                            </h4>
                            <p className="font-extrabold text-emerald-700 text-xs mt-0.5">{l.price_display}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              l.status === "approved"
                                ? "bg-emerald-100 text-emerald-800"
                                : l.status === "rejected"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {l.status}
                          </span>
                          <button
                            onClick={() => updateListing(l.id, { is_published: !l.is_published })}
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              l.is_published
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {l.is_published ? "Published" : "Draft"}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <button
                            onClick={() => {
                              setEditingListing(l);
                              setEditTitle(l.title);
                              setEditCat(l.category_slug);
                              setEditPrice(l.price_display);
                              setEditLoc(l.location || "");
                              setEditShort(l.short_description || "");
                              setEditDesc(l.description || "");
                              setEditImage(l.image_url || "");
                            }}
                            className="rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-1.5 flex items-center justify-center gap-1"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => updateListing(l.id, { featured: !l.featured })}
                            className={`rounded-lg text-xs font-bold py-1.5 ${
                              l.featured ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {l.featured ? "Featured ★" : "Feature"}
                          </button>
                          <button
                            onClick={() => deleteListing(l.id)}
                            className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold py-1.5 flex items-center justify-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Desktop View: Full Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b">
                      <tr>
                        <th className="p-3">Image</th>
                        <th className="p-3">Title</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Vendor</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Published</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.listings
                        .filter((l) => l.type === listingTypeFilter)
                        .map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <img
                                src={l.image_url}
                                alt={l.title}
                                className="h-10 w-10 object-cover rounded-lg border border-slate-200"
                              />
                            </td>
                            <td className="p-3 font-bold text-[#0a2458] max-w-xs truncate">
                              {l.title}
                              {l.rejection_reason && (
                                <div className="text-[10px] text-rose-600 font-normal">
                                  Rejected: {l.rejection_reason}
                                </div>
                              )}
                            </td>
                            <td className="p-3 font-mono uppercase text-slate-600">{l.category_slug}</td>
                            <td className="p-3 text-slate-600">{l.vendor_name || "Admin Direct"}</td>
                            <td className="p-3 font-semibold text-emerald-700">{l.price_display}</td>
                            <td className="p-3">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                  l.status === "approved"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : l.status === "rejected"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {l.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => updateListing(l.id, { is_published: !l.is_published })}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase transition-colors ${
                                  l.is_published
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                                    : "bg-slate-100 text-slate-500 border border-slate-300"
                                }`}
                              >
                                {l.is_published ? "Published" : "Draft"}
                              </button>
                            </td>
                            <td className="p-3 space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setEditingListing(l);
                                  setEditTitle(l.title);
                                  setEditCat(l.category_slug);
                                  setEditPrice(l.price_display);
                                  setEditLoc(l.location || "");
                                  setEditShort(l.short_description || "");
                                  setEditDesc(l.description || "");
                                  setEditImage(l.image_url || "");
                                }}
                                className="rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1 font-bold text-[11px] inline-flex items-center gap-1"
                                title="Edit Listing"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => updateListing(l.id, { featured: !l.featured })}
                                className={`rounded-lg px-2 py-1 font-bold text-[11px] ${
                                  l.featured ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {l.featured ? "Featured ★" : "Feature"}
                              </button>
                              <button
                                onClick={() => updateListing(l.id, { status: "approved" })}
                                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 font-bold text-[11px]"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  setRejectModal({
                                    isOpen: true,
                                    type: "listing",
                                    id: l.id,
                                    reason: "Technical specifications require detailed clarification.",
                                  })
                                }
                                className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2 py-1 font-bold text-[11px]"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => deleteListing(l.id)}
                                className="rounded-lg bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 px-2 py-1 text-[11px]"
                              >
                                <Trash2 className="h-3 w-3 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CATEGORIES */}
          {activeTab === "categories" && (
            <AdminCategoriesPanel
              categories={data.categories}
              subcategories={data.subcategories}
              onRefresh={loadOverview}
            />
          )}

          {/* TAB 7: REQUIREMENTS */}
          {activeTab === "requirements" && (
            <div className="space-y-3">
              {data.requirements.map((r) => (
                <div key={r.id} className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm space-y-2">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase rounded-full bg-blue-100 text-[#1652b8] px-2.5 py-0.5">
                        {r.category_type} • {r.category_slug}
                      </span>
                      <h3 className="font-extrabold text-base text-[#0a2458] mt-1">{r.title}</h3>
                      <p className="text-xs text-slate-600">
                        {r.name} ({r.business_name || "Individual Buyer"}) • {r.location} • Qty: {r.quantity}
                      </p>
                    </div>
                    <div>
                      <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5">
                        {r.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl">{r.description}</p>
                  <div className="pt-2">
                    <button
                      onClick={() =>
                        runAction({ action: "requirement_dispatch_whatsapp", id: r.id })
                      }
                      className="rounded-full bg-[#25D366] hover:bg-[#20b858] text-white px-3.5 py-1.5 text-xs font-bold shadow flex items-center gap-1.5"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Dispatch WhatsApp Alert to Matching Vendors</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 8: ENQUIRIES */}
          {activeTab === "enquiries" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3 shadow-sm">
              <h3 className="font-extrabold text-[#0a2458] text-base">Direct Customer Inquiries ({data.enquiries.length})</h3>
              {data.enquiries.map((e) => (
                <div key={e.id} className="rounded-xl border border-slate-100 p-3 bg-slate-50 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#0a2458]">{e.name} ({e.mobile})</span>
                    <span className="text-slate-500 text-[11px]">Listing: {e.listing_title}</span>
                  </div>
                  <p className="text-slate-700">{e.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 9: SUBSCRIPTIONS */}
          {activeTab === "subscriptions" && (
            <div className="space-y-6">
              <AdminPlansPanel plans={data.plans} onRefresh={loadOverview} />

              <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 overflow-x-auto shadow-sm">
                <h3 className="font-extrabold text-[#0a2458] mb-3">Active Paid Subscribers</h3>
                <table className="w-full text-xs text-left min-w-[550px]">
                  <thead className="bg-slate-50 uppercase font-bold border-b">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Expires At</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.subscriptions.map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="p-3 font-bold">{s.user_name} ({s.user_mobile})</td>
                        <td className="p-3 font-semibold">{s.plan_name}</td>
                        <td className="p-3 font-bold text-emerald-700">₹{s.price_inr.toLocaleString("en-IN")}</td>
                        <td className="p-3 font-mono">{s.ends_at}</td>
                        <td className="p-3 uppercase font-extrabold text-emerald-700">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: PAYMENTS */}
          {activeTab === "payments" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 overflow-x-auto shadow-sm">
              <table className="w-full text-xs text-left min-w-[600px]">
                <thead className="bg-slate-50 uppercase font-bold border-b">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Amount (Incl. GST)</th>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-3 font-mono font-bold text-[#0a2458]">{p.invoice_number}</td>
                      <td className="p-3">{p.user_name}</td>
                      <td className="p-3">{p.plan_name}</td>
                      <td className="p-3 font-bold text-emerald-700">₹{p.amount_inr.toLocaleString("en-IN")}</td>
                      <td className="p-3 font-mono text-slate-500">{p.order_id}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2 py-0.5">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 11: REPORTS & EXPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Generate and download comprehensive spreadsheet reports for sellers, buyers, active listings, payments, and subscription form submissions.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 text-[#0a2458] flex items-center justify-center">
                    <Store className="h-5 w-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#0a2458]">Sellers Directory Report</h4>
                  <p className="text-xs text-slate-500">
                    All registered manufacturers, vendors, GST numbers, verification statuses, and locations.
                  </p>
                  <button
                    onClick={() =>
                      exportToCsv(
                        "rawmat_sellers_report",
                        data.vendors.map((v) => ({
                          ID: v.id,
                          Business_Name: v.business_name,
                          Owner_Name: v.owner_name,
                          Mobile: v.mobile,
                          Email: v.email,
                          GST_Number: v.gst_number,
                          Category: v.business_category,
                          City: v.city,
                          State: v.state,
                          Status: v.verification_status,
                          Rejection_Reason: v.rejection_reason || "",
                        }))
                      )
                    }
                    className="w-full rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Sellers CSV ({data.vendors.length})</span>
                  </button>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-100 text-[#f97316] flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#0a2458]">Buyers & Users Report</h4>
                  <p className="text-xs text-slate-500">
                    Complete registered buyers directory, roles, contact numbers, and account states.
                  </p>
                  <button
                    onClick={() =>
                      exportToCsv(
                        "rawmat_buyers_report",
                        data.users.map((u) => ({
                          ID: u.id,
                          Name: u.name,
                          Email: u.email,
                          Mobile: u.mobile,
                          Role: u.role,
                          Status: u.status,
                          Registered_At: u.created_at,
                        }))
                      )
                    }
                    className="w-full rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Users CSV ({data.users.length})</span>
                  </button>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Package className="h-5 w-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#0a2458]">Catalog Listings Report</h4>
                  <p className="text-xs text-slate-500">
                    Complete database of products, machineries, and services across all industrial categories.
                  </p>
                  <button
                    onClick={() =>
                      exportToCsv(
                        "rawmat_listings_report",
                        data.listings.map((l) => ({
                          ID: l.id,
                          Title: l.title,
                          Type: l.type,
                          Category: l.category_slug,
                          Subcategory: l.subcategory_slug || "",
                          Price: l.price_display,
                          Location: l.location,
                          Vendor: l.vendor_name || "",
                          Status: l.status,
                          Is_Published: l.is_published ? "Yes" : "No",
                          Featured: l.featured ? "Yes" : "No",
                        }))
                      )
                    }
                    className="w-full rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Listings CSV ({data.listings.length})</span>
                  </button>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#0a2458]">Revenue & Payments Report</h4>
                  <p className="text-xs text-slate-500">
                    Official verified GST invoices, payment order IDs, amounts, and tax breakdowns.
                  </p>
                  <button
                    onClick={() =>
                      exportToCsv(
                        "rawmat_payments_report",
                        data.payments.map((p) => ({
                          ID: p.id,
                          Invoice_Number: p.invoice_number,
                          Customer_Name: p.user_name,
                          Plan_Name: p.plan_name,
                          Amount_INR: p.amount_inr,
                          Order_ID: p.order_id,
                          Status: p.status,
                        }))
                      )
                    }
                    className="w-full rounded-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Payments CSV ({data.payments.length})</span>
                  </button>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-[#0a2458]">Subscription Forms Report</h4>
                  <p className="text-xs text-slate-500">
                    All incoming custom subscription form inquiries, remarks, and conversion logs.
                  </p>
                  <button
                    onClick={() =>
                      exportToCsv(
                        "rawmat_subscription_forms",
                        (data.subscriptionForms || []).map((f) => ({
                          ID: f.id,
                          Applicant_Name: f.name,
                          Business_Name: f.business_name,
                          Mobile: f.mobile,
                          Email: f.email,
                          Role: f.user_type,
                          Plan_Name: f.plan_name,
                          Amount_INR: f.amount_inr,
                          Status: f.status,
                          Admin_Remarks: f.admin_remarks || "",
                          Submitted_At: f.created_at,
                        }))
                      )
                    }
                    className="w-full rounded-full bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Forms CSV ({(data.subscriptionForms || []).length})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: AUDIT LOGS */}
          {activeTab === "audit_logs" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 overflow-x-auto shadow-sm space-y-3">
              <h3 className="font-extrabold text-[#0a2458]">System Activity & Audit Trail</h3>
              <table className="w-full text-xs text-left min-w-[500px]">
                <thead className="bg-slate-50 uppercase font-bold border-b">
                  <tr>
                    <th className="p-3">ID / Time</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {(data.auditLogs || []).map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        #{a.id} • {a.created_at}
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{a.user_email || "System"}</td>
                      <td className="p-3">
                        <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-bold uppercase">
                          {a.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-800 font-sans text-xs">{a.details}</td>
                    </tr>
                  ))}
                  {(data.auditLogs || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 font-sans">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 13: CMS PANELS */}
          {activeTab === "offers" && (
            <AdminCmsEditor
              title="Launching Offer Management"
              cmsKey="launching_offer"
              initialValue={data.cms.launchingOffer}
              onSaved={loadOverview}
            />
          )}

          {activeTab === "gallery" && (
            <AdminGalleryPanel gallery={data.gallery} onRefresh={loadOverview} />
          )}

          {activeTab === "about" && (
            <AdminCmsEditor
              title="About Us Content Management"
              cmsKey="about_content"
              initialValue={data.cms.aboutContent}
              onSaved={loadOverview}
            />
          )}

          {activeTab === "content" && (
            <AdminCmsEditor
              title="Homepage Hero Slides CMS"
              cmsKey="hero_slides"
              initialValue={data.cms.heroSlides}
              onSaved={loadOverview}
            />
          )}

          {activeTab === "whatsapp" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3 shadow-sm">
              <h3 className="font-extrabold text-[#0a2458]">
                Automated WhatsApp Opportunity Dispatches
              </h3>
              <p className="text-xs text-slate-500">
                Log of real-time requirement alerts queued or sent directly to verified category vendors.
              </p>
              <div className="space-y-2">
                {data.whatsappNotifications.map((n) => (
                  <div key={n.id} className="rounded-xl border border-slate-100 p-3 bg-slate-50 text-xs">
                    <div className="flex justify-between font-bold text-[#0a2458]">
                      <span>{n.vendor_name} ({n.vendor_whatsapp})</span>
                      <span className="text-[10px] uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {n.category_slug}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 whitespace-pre-wrap">{n.message_preview}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "referrals" && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 sm:p-5 space-y-3 shadow-sm">
              <h3 className="font-extrabold text-[#0a2458]">
                Promote Us • Grow With Us Submissions
              </h3>
              <div className="space-y-3">
                {data.referrals.map((r) => (
                  <div key={r.id} className="rounded-xl border border-slate-200 p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#0a2458]">
                        {r.name} ({r.mobile}) • Code: {r.referral_code}
                      </span>
                      <span className="rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase px-2 py-0.5">
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg">
                      {r.reference_details}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() =>
                          runAction({
                            action: "referral_update",
                            id: r.id,
                            status: "approved",
                            rewardNote: "Eligible for 5% referral payout on customer subscription",
                          })
                        }
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1"
                      >
                        Approve Referral
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <AdminCmsEditor
              title="Contact Settings & Official Company Info"
              cmsKey="contact_settings"
              initialValue={data.cms.contactSettings}
              onSaved={loadOverview}
            />
          )}
        </main>
      </div>

      {/* MOBILE NAVIGATION DRAWER (Opens when mobile Menu button is clicked) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 lg:hidden">
          <div className="w-full max-h-[85vh] rounded-t-3xl bg-[#0a2458] text-white p-5 shadow-2xl border-t border-blue-900/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#f97316] flex items-center justify-center">
                  <Menu className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-black text-base tracking-tight">Admin Sections Menu</h3>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Grouped Navigation List */}
            <div className="overflow-y-auto py-3 space-y-4 flex-1 pr-1">
              {Object.entries(groupedNav).map(([groupTitle, items]) => (
                <div key={groupTitle} className="space-y-1">
                  <p className="text-[10px] uppercase font-black tracking-wider text-blue-300 px-3 py-1">
                    {groupTitle}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isSelected = activeTab === item.id;
                      const isForms = item.id === "subscription_forms";
                      const formsBadge = isForms && (data.kpi?.pendingFormsCount || 0) > 0;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setMobileMenuOpen(false);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                            isSelected
                              ? "bg-[#f97316] text-white shadow-lg shadow-orange-500/20"
                              : "bg-white/5 hover:bg-white/10 text-blue-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {formsBadge && (
                              <span className="rounded-full bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2">
                                {data.kpi?.pendingFormsCount}
                              </span>
                            )}
                            <ChevronRight className="h-3.5 w-3.5 text-white/40" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10 shrink-0 flex items-center justify-between">
              <span className="text-[11px] text-blue-300">RAWMAT MART Portal Control</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LISTING MODAL */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-5 sm:p-7 shadow-2xl text-slate-800 border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-[#f97316]" />
                <h3 className="font-extrabold text-base text-[#0a2458]">Edit Listing (Live Website)</h3>
              </div>
              <button
                onClick={() => setEditingListing(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveEditedListing} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editCat}
                    onChange={(e) => setEditCat(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs bg-white text-slate-800"
                  >
                    {data.categories
                      .filter((c) => c.type === editingListing.type)
                      .map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price Display</label>
                  <input
                    type="text"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editLoc}
                  onChange={(e) => setEditLoc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description / Specs</label>
                <textarea
                  rows={2}
                  value={editShort}
                  onChange={(e) => setEditShort(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Technical Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                />
              </div>

              {/* S3 Image Replacement */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Listing Photo (AWS S3)</label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold cursor-pointer hover:bg-slate-50 bg-slate-100">
                    <FileUp className="h-3.5 w-3.5 text-[#f97316]" />
                    <span>{editUploading ? "Uploading..." : "Upload New Photo (S3)"}</span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      onChange={(e) => handleS3Upload(e, setEditImage, setEditUploading)}
                      className="hidden"
                    />
                  </label>
                  {editImage && (
                    <img
                      src={editImage}
                      alt="Thumbnail"
                      className="h-8 w-8 object-cover rounded-lg border border-slate-200"
                    />
                  )}
                </div>
                <input
                  type="text"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  placeholder="Image URL"
                  className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono text-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUploading}
                  className="rounded-full bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white px-5 py-2 font-bold text-xs shadow"
                >
                  Save Changes Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-800 border border-slate-200">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="font-extrabold text-base">
                Reject {rejectModal.type === "vendor" ? "Vendor Application" : "Catalog Listing"}
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Please state the specific reason for rejection. This feedback will be recorded and shown to the seller.
            </p>
            <textarea
              rows={3}
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="e.g. Uploaded GST Certificate is unreadable or mismatch in business legal name..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-rose-500 focus:outline-none mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModal({ ...rejectModal, isOpen: false })}
                className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (rejectModal.type === "vendor") {
                    updateVendor(rejectModal.id, "rejected", rejectModal.reason);
                  } else {
                    updateListing(rejectModal.id, {
                      status: "rejected",
                      rejection_reason: rejectModal.reason,
                    });
                  }
                  setRejectModal({ ...rejectModal, isOpen: false });
                }}
                className="rounded-full bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 text-xs font-bold shadow transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
