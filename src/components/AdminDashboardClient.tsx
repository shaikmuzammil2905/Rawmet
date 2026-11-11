"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Check,
  Cog,
  CreditCard,
  FileText,
  FolderTree,
  Gift,
  Globe,
  Image as ImageIcon,
  Info,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquare,
  Package,
  Plus,
  Send,
  Settings,
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
  CategoryRecord,
  ContactSettings,
  HeroSlide,
  LaunchingOfferContent,
  ListingRecord,
  RequirementRecord,
  SubcategoryRecord,
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
    totalVendors: number;
    activeVendors: number;
    pendingVendors: number;
    totalListings: number;
    pendingListings: number;
    totalRequirements: number;
    activeSubscriptions: number;
    totalRevenueInr: number;
  };
  categoryBreakdown: Array<{ type: string; count: number }>;
  vendors: VendorRecord[];
  users: UserRecord[];
  listings: ListingRecord[];
  categories: CategoryRecord[];
  subcategories: SubcategoryRecord[];
  requirements: RequirementRecord[];
  enquiries: Array<{ id: number; name: string; mobile: string; message: string; listing_title: string; vendor_name: string; status: string }>;
  subscriptions: Array<{ id: number; user_name: string; user_mobile: string; plan_name: string; price_inr: number; status: string; ends_at: string }>;
  payments: Array<{ id: number; order_id: string; user_name: string; plan_name: string; amount_inr: number; status: string; invoice_number: string }>;
  gallery: Array<{ id: number; title: string; category: string; image_url: string; caption: string }>;
  whatsappNotifications: Array<{ id: number; vendor_name: string; vendor_whatsapp: string; category_slug: string; message_preview: string; created_at: string }>;
  referrals: Array<{ id: number; name: string; mobile: string; location: string; reference_details: string; referral_code: string; status: string; reward_note: string }>;
  plans: SubscriptionPlanRecord[];
  cms: {
    heroSlides: HeroSlide[];
    aboutContent: AboutContent;
    launchingOffer: LaunchingOfferContent;
    contactSettings: ContactSettings;
  };
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "vendors", label: "Vendors", icon: Store },
  { id: "users", label: "Users", icon: Users },
  { id: "products", label: "Products", icon: Package },
  { id: "machineries", label: "Machineries", icon: Cog },
  { id: "services", label: "Services", icon: Wrench },
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "requirements", label: "Requirements", icon: FileText },
  { id: "enquiries", label: "Enquiries", icon: MessageSquare },
  { id: "subscriptions", label: "Subscriptions", icon: Tag },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "offers", label: "Offers", icon: Gift },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "about", label: "About Us", icon: Info },
  { id: "content", label: "Website Content", icon: Globe },
  { id: "whatsapp", label: "WhatsApp Alerts", icon: MessageCircle },
  { id: "referrals", label: "Promote / Referrals", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export function AdminDashboardClient() {
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof NAV_ITEMS)[number]["id"]>("dashboard");
  const [loading, setLoading] = useState(true);

  // Quick Add listing state
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState("");
  const [newPrice, setNewPrice] = useState("Request Quote");
  const [newLoc, setNewLoc] = useState("Hyderabad, Telangana");
  const [newShort, setNewShort] = useState("");

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview");
      if (res.status === 401 || res.status === 403) {
        router.push("/admin/login");
        return;
      }
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  async function updateVendor(vendorId: number, verificationStatus: "approved" | "rejected" | "suspended") {
    const res = await fetch("/api/admin/vendors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendorId, verificationStatus }),
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
      showToast("Listing updated.", "success");
      loadOverview();
    }
  }

  async function deleteListing(id: number) {
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
        price_display: newPrice,
        location: newLoc,
        status: "approved",
      }),
    });
    if (res.ok) {
      showToast("Listing published live!", "success");
      setNewTitle("");
      setNewShort("");
      loadOverview();
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

  if (loading || !data) {
    return <div className="p-12 text-center text-sm text-slate-500">Loading RAWMET Admin Panel...</div>;
  }

  const listingTypeFilter =
    activeTab === "products" ? "product" : activeTab === "machineries" ? "machinery" : "service";

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-[#06183d] text-white shrink-0 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 px-2 pb-4 border-b border-white/10">
            <ShieldCheck className="h-6 w-6 text-[#f97316]" />
            <div>
              <p className="font-extrabold text-sm">RAWMET Admin</p>
              <p className="text-[11px] text-blue-200">Control &amp; CMS</p>
            </div>
          </div>

          <nav className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-left transition-colors ${
                    activeTab === item.id
                      ? "bg-[#f97316] text-white shadow"
                      : "text-blue-100 hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-red-600/80 py-2.5 text-xs font-bold text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out Admin
        </button>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 p-4 sm:p-8 overflow-x-hidden">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-[#0a2458] capitalize">
            {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
          </h1>
          <span className="text-xs font-semibold text-slate-500">
            Dynamic CMS &amp; Marketplace Operations
          </span>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
              {[
                { label: "Total Users", value: data.kpi.totalUsers, color: "text-[#0a2458]" },
                { label: "Total Vendors", value: data.kpi.totalVendors, color: "text-[#0a2458]" },
                { label: "Active Vendors", value: data.kpi.activeVendors, color: "text-emerald-600" },
                { label: "Pending Vendors", value: data.kpi.pendingVendors, color: "text-amber-600" },
                { label: "Total Listings", value: data.kpi.totalListings, color: "text-[#1652b8]" },
                { label: "Pending Listings", value: data.kpi.pendingListings, color: "text-amber-600" },
                { label: "Requirements", value: data.kpi.totalRequirements, color: "text-[#0a2458]" },
                { label: "Active Subscriptions", value: data.kpi.activeSubscriptions, color: "text-emerald-600" },
                { label: "Verified Revenue", value: `₹${data.kpi.totalRevenueInr.toLocaleString("en-IN")}`, color: "text-[#f97316]" },
              ].map((k) => (
                <div key={k.label} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase text-slate-500">{k.label}</p>
                  <p className={`text-2xl font-extrabold mt-1 ${k.color}`}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Visual Distribution Chart */}
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-[#0a2458] mb-4">
                Marketplace Catalog Distribution
              </h2>
              <div className="space-y-3">
                {data.categoryBreakdown.map((b) => {
                  const pct = data.kpi.totalListings > 0 ? Math.round((b.count / data.kpi.totalListings) * 100) : 0;
                  return (
                    <div key={b.type} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold capitalize">
                        <span className="text-[#0a2458]">{b.type}</span>
                        <span className="text-slate-600">{b.count} listings ({pct}%)</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            b.type === "product" ? "bg-[#0a2458]" : b.type === "machinery" ? "bg-[#1652b8]" : "bg-[#f97316]"
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

        {activeTab === "vendors" && (
          <div className="rounded-2xl bg-white border border-slate-200 p-5 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="border-b text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-4">Business</th>
                  <th className="py-2.5 pr-4">GSTIN / ID</th>
                  <th className="py-2.5 pr-4">Category</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.vendors.map((v) => (
                  <tr key={v.id}>
                    <td className="py-3 pr-4">
                      <p className="font-bold text-[#0a2458]">{v.business_name}</p>
                      <p className="text-xs text-slate-500">{v.owner_name} • {v.mobile}</p>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">{v.gst_number}</td>
                    <td className="py-3 pr-4 capitalize">{v.product_service_category}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                        v.verification_status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : v.verification_status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                      }`}>
                        {v.verification_status}
                      </span>
                    </td>
                    <td className="py-3 flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => updateVendor(v.id, "approved")} className="rounded-lg bg-emerald-600 text-white px-2.5 py-1 text-xs font-bold">
                        Approve
                      </button>
                      <button type="button" onClick={() => updateVendor(v.id, "rejected")} className="rounded-lg bg-red-600 text-white px-2.5 py-1 text-xs font-bold">
                        Reject
                      </button>
                      <button type="button" onClick={() => updateVendor(v.id, "suspended")} className="rounded-lg border px-2.5 py-1 text-xs font-bold text-slate-600">
                        Suspend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "users" && (
          <div className="rounded-2xl bg-white border border-slate-200 p-5 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="border-b text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-4">Name</th>
                  <th className="py-2.5 pr-4">Contact</th>
                  <th className="py-2.5 pr-4">Role</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 pr-4 font-bold text-[#0a2458]">{u.name}</td>
                    <td className="py-3 pr-4 text-xs">{u.mobile} • {u.email}</td>
                    <td className="py-3 pr-4 uppercase text-xs font-bold">{u.role}</td>
                    <td className="py-3 pr-4 uppercase text-xs font-bold">{u.status}</td>
                    <td className="py-3">
                      {u.role !== "admin" && (
                        <button
                          type="button"
                          onClick={() =>
                            runAction({
                              action: "user_status",
                              id: u.id,
                              status: u.status === "active" ? "suspended" : "active",
                            })
                          }
                          className="rounded-lg border px-3 py-1 text-xs font-bold"
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

        {(activeTab === "products" || activeTab === "machineries" || activeTab === "services") && (
          <div className="space-y-6">
            <form onSubmit={(e) => addAdminListing(listingTypeFilter, e)} className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
              <h3 className="font-extrabold text-[#0a2458] flex items-center gap-1.5 text-sm">
                <Plus className="h-4 w-4 text-[#f97316]" />
                Quick Add {listingTypeFilter}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Listing Title *"
                  className="rounded-xl border px-3 py-2 text-xs"
                />
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  className="rounded-xl border px-3 py-2 text-xs bg-white"
                >
                  <option value="">Select Category</option>
                  {data.categories
                    .filter((c) => c.type === listingTypeFilter)
                    .map((c) => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                </select>
                <input
                  type="text"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Price Display"
                  className="rounded-xl border px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  value={newLoc}
                  onChange={(e) => setNewLoc(e.target.value)}
                  placeholder="Location"
                  className="rounded-xl border px-3 py-2 text-xs"
                />
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newShort}
                  onChange={(e) => setNewShort(e.target.value)}
                  placeholder="Short description..."
                  className="flex-1 rounded-xl border px-3 py-2 text-xs"
                />
                <button type="submit" className="rounded-full bg-[#f97316] text-white px-5 py-2 text-xs font-bold">
                  Publish Live
                </button>
              </div>
            </form>

            <div className="rounded-2xl bg-white border border-slate-200 p-5 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-500">
                    <th className="py-2 pr-4">Listing</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Vendor</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.listings
                    .filter((l) => l.type === listingTypeFilter)
                    .map((l) => (
                      <tr key={l.id}>
                        <td className="py-3 pr-4 font-bold text-[#0a2458]">{l.title}</td>
                        <td className="py-3 pr-4 text-xs">{l.category_slug}</td>
                        <td className="py-3 pr-4 text-xs">{l.vendor_name}</td>
                        <td className="py-3 pr-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                            l.status === "approved" ? "bg-emerald-100 text-emerald-800" : l.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="py-3 flex gap-1.5">
                          <button type="button" onClick={() => updateListing(l.id, { status: "approved" })} title="Approve" className="rounded-lg bg-emerald-600 text-white p-1.5">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => updateListing(l.id, { status: "rejected" })} title="Reject" className="rounded-lg bg-amber-500 text-white p-1.5">
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => deleteListing(l.id)} title="Delete" className="rounded-lg bg-red-600 text-white p-1.5">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <AdminCategoriesPanel
            categories={data.categories}
            subcategories={data.subcategories}
            onRefresh={loadOverview}
          />
        )}

        {activeTab === "requirements" && (
          <div className="space-y-3">
            {data.requirements.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#f97316]">{r.category_slug} • {r.status}</span>
                  <h3 className="font-bold text-[#0a2458]">{r.title}</h3>
                  <p className="text-xs text-slate-500">{r.name} ({r.mobile}) • Qty: {r.quantity} • Matched: {r.matched_vendors_count}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => runAction({ action: "requirement_dispatch_whatsapp", id: r.id })}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold"
                  >
                    <Send className="h-3.5 w-3.5" /> Match &amp; Notify WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => runAction({ action: "requirement_status", id: r.id, status: "closed" })}
                    className="rounded-lg border px-3 py-1.5 text-xs font-bold"
                  >
                    Mark Closed
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "enquiries" && (
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            {data.enquiries.map((e) => (
              <div key={e.id} className="rounded-xl bg-slate-50 p-4 flex flex-wrap justify-between gap-2 text-xs">
                <div>
                  <p className="font-bold text-[#0a2458]">{e.listing_title || "Enquiry"} → {e.vendor_name}</p>
                  <p className="text-slate-500">From: {e.name} ({e.mobile})</p>
                  <p className="text-slate-700 mt-1">{e.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => runAction({ action: "enquiry_status", id: e.id, status: "contacted" })}
                  className="self-start rounded-lg bg-[#0a2458] text-white px-3 py-1 font-bold"
                >
                  {e.status === "contacted" ? "Contacted ✓" : "Mark Contacted"}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "subscriptions" && (
          <div className="space-y-6">
            <AdminPlansPanel plans={data.plans} onRefresh={loadOverview} />
            <div className="rounded-2xl bg-white border border-slate-200 p-5">
              <h3 className="font-extrabold text-[#0a2458] mb-3">Subscriber Roster ({data.subscriptions.length})</h3>
              <div className="space-y-2 text-xs">
                {data.subscriptions.map((s) => (
                  <div key={s.id} className="flex justify-between rounded-xl bg-slate-50 p-3">
                    <span><strong>{s.user_name}</strong> ({s.user_mobile}) — {s.plan_name}</span>
                    <span className="font-bold text-emerald-700 uppercase">{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="rounded-2xl bg-white border border-slate-200 p-5 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b uppercase text-slate-500">
                  <th className="py-2 pr-4">Order ID</th>
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Plan</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 pr-4 font-mono">{p.order_id}</td>
                    <td className="py-2.5 pr-4">{p.user_name}</td>
                    <td className="py-2.5 pr-4">{p.plan_name}</td>
                    <td className="py-2.5 pr-4 font-bold">₹{p.amount_inr.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 pr-4 uppercase font-bold">{p.status}</td>
                    <td className="py-2.5">{p.invoice_number || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "offers" && (
          <AdminCmsEditor
            cmsKey="launching_offer"
            initialValue={data.cms.launchingOffer}
            title="Launching Offer & Special Discounts"
            onSaved={loadOverview}
          />
        )}

        {activeTab === "gallery" && (
          <AdminGalleryPanel gallery={data.gallery} onRefresh={loadOverview} />
        )}

        {activeTab === "about" && (
          <AdminCmsEditor
            cmsKey="about_content"
            initialValue={data.cms.aboutContent}
            title="About Us Content"
            onSaved={loadOverview}
          />
        )}

        {activeTab === "content" && (
          <AdminCmsEditor
            cmsKey="hero_slides"
            initialValue={data.cms.heroSlides}
            title="Hero Banners & Headlines"
            onSaved={loadOverview}
          />
        )}

        {activeTab === "whatsapp" && (
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            <h3 className="font-extrabold text-[#0a2458]">Automated WhatsApp Opportunity Dispatches</h3>
            {data.whatsappNotifications.map((w) => (
              <div key={w.id} className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs space-y-1">
                <div className="flex justify-between font-bold text-emerald-950">
                  <span>{w.vendor_name} ({w.vendor_whatsapp})</span>
                  <span className="uppercase">{w.category_slug}</span>
                </div>
                <p className="text-slate-700 whitespace-pre-line">{w.message_preview}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "referrals" && (
          <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-3">
            <h3 className="font-extrabold text-[#0a2458]">Promote Us • Grow With Us Submissions</h3>
            {data.referrals.length === 0 ? (
              <p className="text-sm text-slate-500">No promotional partner submissions yet.</p>
            ) : (
              data.referrals.map((r) => (
                <div key={r.id} className="rounded-xl bg-slate-50 border p-4 flex flex-wrap justify-between gap-3 text-xs">
                  <div>
                    <p className="font-bold text-[#0a2458]">{r.name} ({r.mobile}) — Code: {r.referral_code}</p>
                    <p className="text-slate-500">{r.location} • {r.reference_details}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => runAction({ action: "referral_update", id: r.id, status: "approved" })}
                      className="rounded-lg bg-[#0a2458] text-white px-3 py-1 font-bold"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction({ action: "referral_update", id: r.id, status: "rewarded", rewardNote: "Reward credited" })}
                      className="rounded-lg bg-emerald-600 text-white px-3 py-1 font-bold"
                    >
                      Mark Rewarded
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <AdminCmsEditor
            cmsKey="contact_settings"
            initialValue={data.cms.contactSettings}
            title="Portal Contact & Referral Settings"
            onSaved={loadOverview}
          />
        )}
      </div>
    </div>
  );
}

