"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Building2, FileText, MapPin, Search } from "lucide-react";
import type { ListingRecord, RequirementRecord } from "@/lib/types";
import { ListingCard } from "./ListingCard";

interface SearchVendor {
  id: number;
  business_name: string;
  city: string;
  state: string;
  product_service_category: string;
  business_category: string;
  description: string;
}

export function GlobalSearchClient({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const [type, setType] = useState<"" | "product" | "machinery" | "service">("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ListingRecord[]>([]);
  const [vendors, setVendors] = useState<SearchVendor[]>([]);
  const [requirements, setRequirements] = useState<RequirementRecord[]>([]);

  async function runSearch(queryStr: string, listingType: string, loc: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        global: "1",
        q: queryStr,
        type: listingType,
        location: loc,
        limit: "24",
      });
      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setVendors(data.vendors || []);
      setRequirements(data.requirements || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch(initialQuery, "", "");
  }, [initialQuery]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#0a2458] to-[#123983] p-6 sm:p-8 text-white shadow-lg mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold">Global Industrial Search</h1>
        <p className="text-sm text-blue-100 mt-1">
          Search across Products, Machineries, Services, GST-Verified Vendors, and Live Business Requirements.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(q, type, location);
          }}
          className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-2 rounded-2xl shadow-lg"
        >
          <div className="md:col-span-5 relative flex items-center">
            <Search className="h-4 w-4 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Keyword (Rubber, HDPE, SS304, Bio-Diesel, AMC)..."
              className="w-full px-3 py-2 text-sm text-slate-900 focus:outline-none"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "" | "product" | "machinery" | "service")}
              aria-label="Listing type"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="product">Products</option>
              <option value="machinery">Machineries</option>
              <option value="service">Services</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white py-2.5 px-4 text-sm font-bold transition-colors"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>
      </div>

      {/* Listings Results */}
      <section className="mb-10">
        <h2 className="text-xl font-extrabold text-[#0a2458] mb-4">
          Matching Listings ({items.length})
        </h2>
        {items.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-600">
            No listings matched your query. Try another keyword or{" "}
            <Link href="/requirements#post" className="font-bold text-[#f97316] underline">
              post a real-time requirement
            </Link>
            .
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </section>

      {/* Vendors Results */}
      {vendors.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-extrabold text-[#0a2458] mb-4">
            Verified Vendors ({vendors.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((v) => (
              <div key={v.id} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <BadgeCheck className="h-4 w-4" />
                  GST Verified Vendor
                </div>
                <h3 className="mt-2 text-base font-extrabold text-[#0a2458] flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[#f97316]" />
                  {v.business_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{v.business_category}</p>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">{v.description}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-[#f97316]" />
                    {v.city}, {v.state}
                  </span>
                  <Link href={`/products/${v.product_service_category}`} className="font-bold text-[#1652b8]">
                    View Category
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Requirements Results */}
      {requirements.length > 0 && (
        <section>
          <h2 className="text-xl font-extrabold text-[#0a2458] mb-4">
            Matching Live Requirements ({requirements.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirements.map((r) => (
              <Link
                key={r.id}
                href="/requirements"
                className="rounded-2xl bg-white border border-slate-200 p-5 hover:border-[#1652b8] transition-colors flex items-start gap-3"
              >
                <FileText className="h-5 w-5 text-[#f97316] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold uppercase text-[#1652b8]">
                    {r.category_slug.replace(/-/g, " ")} • {r.location}
                  </span>
                  <h3 className="text-sm font-bold text-[#0a2458] mt-0.5">{r.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{r.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

