"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Filter, MapPin, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { CategoryRecord, ListingRecord, SubcategoryRecord } from "@/lib/types";
import { ListingCard } from "./ListingCard";

interface CatalogBrowserProps {
  type: "product" | "machinery" | "service";
  title: string;
  subtitle: string;
  categories: CategoryRecord[];
  subcategories: SubcategoryRecord[];
  initialCategory?: string;
  initialItems: ListingRecord[];
  initialTotal: number;
  basePath: string;
}

export function CatalogBrowser({
  type,
  title,
  subtitle,
  categories,
  subcategories,
  initialCategory = "",
  initialItems,
  initialTotal,
  basePath,
}: CatalogBrowserProps) {
  const [items, setItems] = useState<ListingRecord[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState("");
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState<"newest" | "views" | "title">("newest");
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 12;

  const activeCategoryObj = categories.find((c) => c.slug === category);
  const visibleSubs = activeCategoryObj
    ? subcategories.filter((s) => s.category_id === activeCategoryObj.id)
    : [];

  async function fetchFiltered(nextOffset = 0, append = false) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        category,
        subcategory,
        q,
        location,
        sort,
        limit: String(limit),
        offset: String(nextOffset),
      });
      const res = await fetch(`/api/listings?${params.toString()}`);
      const data = await res.json();
      setItems((prev) => (append ? [...prev, ...(data.items || [])] : data.items || []));
      setTotal(data.total || 0);
      setOffset(nextOffset);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCategory(initialCategory);
    setSubcategory("");
  }, [initialCategory]);

  function handleReset() {
    setCategory("");
    setSubcategory("");
    setQ("");
    setLocation("");
    setSort("newest");
    setTimeout(() => {
      fetch("/api/listings?type=" + type)
        .then((r) => r.json())
        .then((d) => {
          setItems(d.items || []);
          setTotal(d.total || 0);
          setOffset(0);
        });
    }, 10);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      {/* Page Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0a2458] via-[#123983] to-[#0a2458] p-6 sm:p-8 text-white shadow-lg mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-300">
              RAWMET.com Verified Marketplace
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold">{title}</h1>
            <p className="mt-1.5 text-sm text-blue-100 max-w-2xl">{subtitle}</p>
          </div>
          <Link
            href="/requirements#post"
            className="inline-flex items-center justify-center rounded-full bg-[#f97316] hover:bg-[#ea580c] px-5 py-2.5 text-sm font-bold text-white shadow shrink-0 transition-all"
          >
            Post Custom Requirement
          </Link>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Link
          href={basePath}
          onClick={() => setCategory("")}
          className={`rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
            !category
              ? "bg-[#0a2458] text-white shadow"
              : "bg-white border border-slate-200 text-slate-700 hover:border-[#0a2458]"
          }`}
        >
          All {type === "product" ? "Products" : type === "machinery" ? "Machineries" : "Services"}
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`${basePath}/${cat.slug}`}
            className={`rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              category === cat.slug
                ? "bg-[#f97316] text-white shadow"
                : "bg-white border border-slate-200 text-slate-700 hover:border-[#0a2458]"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Filter Toolbar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchFiltered(0, false);
        }}
        className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center"
      >
        <div className="lg:col-span-4 relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Keyword (e.g. EPDM, HDPE, SS304, CNC)..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-[#1652b8] focus:outline-none"
          />
        </div>

        <div className="lg:col-span-3 relative">
          <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or State (e.g. Pune, Gujarat)..."
            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-[#1652b8] focus:outline-none"
          />
        </div>

        <div className="lg:col-span-2">
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            aria-label="Subcategory"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-[#1652b8] focus:outline-none"
          >
            <option value="">All Subcategories</option>
            {visibleSubs.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-1">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "views" | "title")}
            aria-label="Sort listings"
            className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm bg-white focus:border-[#1652b8] focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="views">Popular</option>
            <option value="title">A–Z</option>
          </select>
        </div>

        <div className="lg:col-span-2 flex gap-2">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0a2458] hover:bg-[#06183d] text-white px-3 py-2 text-sm font-semibold transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Apply</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Reset filters"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-100"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </form>

      {/* Results Header */}
      <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
        <p className="font-medium flex items-center gap-1.5">
          <SlidersHorizontal className="h-4 w-4 text-[#1652b8]" />
          Showing <strong>{items.length}</strong> of <strong>{total}</strong> verified listings
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading && items.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-2xl bg-white border border-slate-200 h-80 animate-pulse p-4 space-y-3">
              <div className="h-40 rounded-xl bg-slate-200" />
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center">
          <p className="text-lg font-bold text-[#0a2458]">No matching listings found</p>
          <p className="mt-1 text-sm text-slate-600">
            Try clearing your filters or post a Real-Time Requirement so verified vendors contact you directly.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset Filters
            </button>
            <Link
              href="/requirements#post"
              className="rounded-full bg-[#f97316] text-white px-5 py-2 text-sm font-semibold"
            >
              Post Requirement
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>

          {items.length < total && (
            <div className="mt-8 text-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => fetchFiltered(offset + limit, true)}
                className="rounded-full bg-[#0a2458] hover:bg-[#06183d] disabled:opacity-60 text-white px-7 py-3 text-sm font-bold shadow transition-all"
              >
                {loading ? "Loading..." : `Load More (${total - items.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

