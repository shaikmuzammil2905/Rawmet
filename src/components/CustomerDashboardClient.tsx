"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  CheckCircle2,
  CreditCard,
  FileText,
  LogOut,
  MessageSquare,
  Printer,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useToast } from "./ToastProvider";

interface DashboardPayload {
  user: { id: number; name: string; email: string; mobile: string; whatsapp: string; role: string };
  activeSubscription: { plan_name: string; starts_at: string; ends_at: string; status: string } | null;
  savedListings: Array<{ id: number; title: string; slug: string; category_slug: string; price_display: string; image_url: string; vendor_name: string }>;
  requirements: Array<{ id: number; title: string; category_slug: string; quantity: string; location: string; status: string; matched_vendors_count: number; created_at: string }>;
  enquiries: Array<{ id: number; listing_title: string; vendor_name: string; message: string; status: string; created_at: string }>;
  payments: Array<{ id: number; order_id: string; plan_name: string; amount_inr: number; gst_amount_inr: number; status: string; invoice_number: string; created_at: string }>;
}

export function CustomerDashboardClient() {
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "saved" | "requirements" | "enquiries" | "payments">("overview");
  const [invoicePayment, setInvoicePayment] = useState<DashboardPayload["payments"][number] | null>(null);

  async function loadDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/dashboard");
      if (res.status === 401) {
        router.push("/login?next=/dashboard");
        return;
      }
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function removeSaved(listingId: number) {
    await fetch(`/api/saved-listings?listingId=${listingId}`, { method: "DELETE" });
    showToast("Removed from saved listings.", "info");
    loadDashboard();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (loading || !data) {
    return <div className="mx-auto max-w-6xl px-4 py-12 text-center text-sm text-slate-500">Loading your dashboard...</div>;
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0a2458] to-[#123983] p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-orange-300">
            RAWMET.com Customer Portal
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Welcome, {data.user.name}</h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1">
            Mobile: {data.user.mobile} • {data.user.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/subscriptions"
            className="rounded-full bg-[#f97316] hover:bg-[#ea580c] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow"
          >
            {data.activeSubscription ? `Active: ${data.activeSubscription.plan_name}` : "Upgrade to Paid Plan"}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs sm:text-sm font-bold text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "overview", label: "Profile & Overview", icon: User },
          { id: "saved", label: `Saved Listings (${data.savedListings.length})`, icon: Bookmark },
          { id: "requirements", label: `Requirements (${data.requirements.length})`, icon: FileText },
          { id: "enquiries", label: `Enquiries (${data.enquiries.length})`, icon: MessageSquare },
          { id: "payments", label: `Payments & Invoices (${data.payments.length})`, icon: CreditCard },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as typeof tab)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                tab === t.id
                  ? "bg-[#0a2458] text-white shadow"
                  : "bg-white border border-slate-200 text-slate-700 hover:border-[#0a2458]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
            <h2 className="text-lg font-extrabold text-[#0a2458]">Subscription Access</h2>
            {data.activeSubscription ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-900 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {data.activeSubscription.plan_name}
                </p>
                <p className="text-xs">Valid until: {new Date(data.activeSubscription.ends_at).toLocaleDateString("en-IN")}</p>
                <p className="text-xs text-emerald-700 pt-1">Enhanced buyer contacts, CA advice &amp; GST support unlocked*</p>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 space-y-2">
                <p className="font-bold">Free Tier Access</p>
                <p className="text-xs">Upgrade to a paid plan to unlock Launching Offer benefits, CA advice, and priority supplier access.</p>
                <Link href="/subscriptions" className="inline-block rounded-full bg-[#f97316] text-white px-4 py-1.5 text-xs font-bold">
                  View Plans
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
            <h2 className="text-lg font-extrabold text-[#0a2458]">Quick Browse &amp; Actions</h2>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <Link href="/products" className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-[#0a2458] hover:bg-blue-50 flex items-center justify-between">
                <span>Browse Products</span>
                <Search className="h-4 w-4 text-[#f97316]" />
              </Link>
              <Link href="/machineries" className="rounded-xl border border-slate-200 px-4 py-2.5 font-semibold text-[#0a2458] hover:bg-blue-50 flex items-center justify-between">
                <span>Explore Machineries</span>
                <Search className="h-4 w-4 text-[#f97316]" />
              </Link>
              <Link href="/requirements#post" className="rounded-xl bg-[#0a2458] text-white px-4 py-2.5 font-bold hover:bg-[#06183d] text-center">
                + Post New Requirement
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
            <h2 className="text-lg font-extrabold text-[#0a2458] flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#f97316]" />
              Account Notifications
            </h2>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="rounded-xl bg-slate-50 p-3">
                <strong>Portal Active:</strong> Your account can post requirements and enquire with GST-verified suppliers.
              </li>
              {data.requirements.slice(0, 2).map((r) => (
                <li key={r.id} className="rounded-xl bg-blue-50/70 p-3">
                  Requirement &quot;{r.title}&quot; matched <strong>{r.matched_vendors_count}</strong> vendor(s).
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === "saved" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.savedListings.length === 0 ? (
            <div className="col-span-full rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-600">
              You have no saved listings yet. Browse the marketplace to bookmark suppliers.
            </div>
          ) : (
            data.savedListings.map((l) => (
              <div key={l.id} className="rounded-2xl bg-white border border-slate-200 p-4 flex gap-4 items-center">
                <img src={l.image_url} alt={l.title} className="h-20 w-24 rounded-xl object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <Link href={`/listings/${l.slug}`} className="font-bold text-sm text-[#0a2458] hover:underline line-clamp-2">
                    {l.title}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">{l.vendor_name}</p>
                  <p className="text-xs font-bold text-[#f97316] mt-1">{l.price_display}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeSaved(l.id)}
                  aria-label="Remove saved listing"
                  className="p-2 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "requirements" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
          {data.requirements.length === 0 ? (
            <p className="text-sm text-slate-600">No requirements posted yet.</p>
          ) : (
            data.requirements.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 flex flex-wrap justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#1652b8]">{r.category_slug}</span>
                  <h3 className="font-bold text-[#0a2458]">{r.title}</h3>
                  <p className="text-xs text-slate-500">Qty: {r.quantity || "—"} • Location: {r.location || "—"}</p>
                </div>
                <span className="self-start rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-bold">
                  {r.matched_vendors_count} Vendor(s) Notified
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "enquiries" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-3">
          {data.enquiries.length === 0 ? (
            <p className="text-sm text-slate-600">No enquiries sent yet.</p>
          ) : (
            data.enquiries.map((e) => (
              <div key={e.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#0a2458]">{e.listing_title || "General Enquiry"}</span>
                  <span className="uppercase text-[#f97316]">{e.status}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Vendor: {e.vendor_name || "RAWMET Desk"}</p>
                <p className="text-sm text-slate-700 mt-2">{e.message}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "payments" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 overflow-x-auto">
          {data.payments.length === 0 ? (
            <p className="text-sm text-slate-600">No subscription payment records yet.</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-4">Order ID</th>
                  <th className="py-2.5 pr-4">Plan</th>
                  <th className="py-2.5 pr-4">Amount (incl. GST)</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-4 font-mono text-xs">{p.order_id}</td>
                    <td className="py-3 pr-4 font-semibold">{p.plan_name}</td>
                    <td className="py-3 pr-4 font-bold">₹{p.amount_inr.toLocaleString("en-IN")}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                          p.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {p.invoice_number ? (
                        <button
                          type="button"
                          onClick={() => setInvoicePayment(p)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#1652b8] hover:underline"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          {p.invoice_number}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {invoicePayment && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4" onClick={() => setInvoicePayment(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-[#0a2458]">RAWMET.com GST Tax Invoice</h3>
                <p className="text-xs text-slate-500">{invoicePayment.invoice_number}</p>
              </div>
              <button type="button" onClick={() => window.print()} className="rounded-full bg-[#0a2458] text-white px-4 py-1.5 text-xs font-bold">
                Print
              </button>
            </div>
            <div className="text-sm space-y-1.5">
              <p><strong>Customer:</strong> {data.user.name} ({data.user.mobile})</p>
              <p><strong>Plan:</strong> {invoicePayment.plan_name}</p>
              <p><strong>Order ID:</strong> {invoicePayment.order_id}</p>
              <p><strong>Total Paid (Incl. 18% GST):</strong> ₹{invoicePayment.amount_inr.toLocaleString("en-IN")}</p>
              <p><strong>GST Component:</strong> ₹{invoicePayment.gst_amount_inr.toLocaleString("en-IN")}</p>
            </div>
            <button type="button" onClick={() => setInvoicePayment(null)} className="w-full rounded-xl border py-2 text-xs font-bold">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

