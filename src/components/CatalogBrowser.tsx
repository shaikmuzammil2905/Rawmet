"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
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
  categories,
  subcategories,
  initialCategory = "",
  initialItems,
  initialTotal,
  basePath,
}: CatalogBrowserProps) {
  const router = useRouter();
  const [items, setItems] = useState<ListingRecord[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"newest" | "views" | "title">("newest");
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 12;

  const activeCategoryObj = categories.find((c) => c.slug === category);
  const visibleSubs = activeCategoryObj
    ? subcategories.filter((s) => s.category_id === activeCategoryObj.id)
    : subcategories.filter((s) => categories.some((c) => c.id === s.category_id));

  async function fetchFiltered(
    nextCat = category,
    nextSub = subcategory,
    nextQ = q,
    nextSort = sort,
    nextOffset = 0,
    append = false
  ) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type,
        category: nextCat,
        subcategory: nextSub,
        q: nextQ,
        sort: nextSort,
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
    setItems(initialItems);
    setTotal(initialTotal);
  }, [initialCategory, initialItems, initialTotal]);

  function handleReset() {
    setCategory("");
    setSubcategory("");
    setQ("");
    setSort("newest");
    if (initialCategory) {
      router.push(basePath);
      return;
    }
    fetchFiltered("", "", "", "newest", 0, false);
  }

  function handleCategorySelect(slug: string) {
    setCategory(slug);
    setSubcategory("");
    if (slug) {
      router.push(`${basePath}/${slug}`);
    } else {
      router.push(basePath);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* 1. Top Clean Search Bar (No giant hero banner!) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          fetchFiltered(category, subcategory, q, sort, 0, false);
        }}
        className="flex items-center rounded-2xl bg-white border border-slate-200 p-1.5 shadow-sm focus-within:border-[#1652b8] focus-within:shadow-md transition-all"
      >
        <Search className="h-5 w-5 text-slate-400 ml-3 shrink-0" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${type === "product" ? "rubber, plastic, metals, bio petro chemicals" : type === "machinery" ? "machineries & industrial plants" : "industrial services"}...`}
          aria-label="Search catalog"
          className="w-full min-w-0 bg-transparent px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#0a2458] hover:bg-[#f97316] text-white px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold transition-colors shrink-0"
        >
          Search
        </button>
      </form>

      {/* 2. Visual Square-Card Category Grid (Reference: image copy 16.png) */}
      <section aria-label="Categories">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-[#f97316]" />
            <h1 className="text-lg sm:text-2xl font-extrabold text-[#0a2458]">{title}</h1>
          </div>
          <Link
            href="/requirements#post"
            className="text-xs font-bold text-[#f97316] hover:underline shrink-0"
          >
            + Post Requirement
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {categories.map((cat) => {
            const isSelected = category === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`${basePath}/${cat.slug}`}
                className={`group rounded-2xl bg-white p-2.5 sm:p-3.5 border transition-all flex flex-col items-center text-center shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                  isSelected
                    ? "border-[#f97316] ring-2 ring-[#f97316]/25 bg-orange-50/30"
                    : "border-slate-100 hover:border-blue-200"
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-xs mb-2">
                  <img
                    src={cat.image_url || "/images/cat-products.png"}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <span className="text-[10.5px] sm:text-xs font-extrabold uppercase tracking-tight text-[#0a2458] group-hover:text-[#1652b8] line-clamp-2 leading-tight">
                  {cat.name}
                </span>
              </Link>
            );
          })}

          {/* MORE / ALL Card matching reference */}
          <Link
            href={basePath}
            onClick={(e) => {
              if (!category) {
                e.preventDefault();
                handleReset();
              }
            }}
            className={`group rounded-2xl p-2.5 sm:p-3.5 border transition-all flex flex-col items-center justify-center text-center shadow-xs hover:shadow-md ${
              !category
                ? "bg-[#eef4ff] border-[#1652b8]/30"
                : "bg-slate-50 border-slate-200 hover:bg-[#eef4ff]"
            }`}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#0a2458] group-hover:bg-[#f97316] text-white flex items-center justify-center shadow-sm mb-2 transition-colors">
              <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" />
            </div>
            <span className="text-[10.5px] sm:text-xs font-extrabold uppercase tracking-wide text-[#0a2458]">
              More
            </span>
          </Link>
        </div>
      </section>

      {/* 3. Dropdown Filter Bar (No City/State field!) */}
      <div className="rounded-2xl bg-white border border-slate-200 p-3 sm:p-4 shadow-xs grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-center">
        <div className="col-span-2 sm:col-span-4">
          <select
            value={category}
            onChange={(e) => handleCategorySelect(e.target.value)}
            aria-label="Filter by category"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm font-semibold text-[#0a2458] bg-slate-50/70 focus:border-[#1652b8] focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1 sm:col-span-4">
          <select
            value={subcategory}
            onChange={(e) => {
              const nextSub = e.target.value;
              setSubcategory(nextSub);
              fetchFiltered(category, nextSub, q, sort, 0, false);
            }}
            aria-label="Filter by subcategory"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm bg-white focus:border-[#1652b8] focus:outline-none"
          >
            <option value="">All Subcategories</option>
            {visibleSubs.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-1 sm:col-span-3">
          <select
            value={sort}
            onChange={(e) => {
              const nextSort = e.target.value as "newest" | "views" | "title";
              setSort(nextSort);
              fetchFiltered(category, subcategory, q, nextSort, 0, false);
            }}
            aria-label="Sort listings"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm bg-white focus:border-[#1652b8] focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="views">Popular</option>
            <option value="title">A–Z</option>
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1 flex justify-end">
          <button
            type="button"
            onClick={handleReset}
            title="Reset filters"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
        <p className="font-medium flex items-center gap-1.5">
          <SlidersHorizontal className="h-4 w-4 text-[#1652b8]" />
          Showing <strong>{items.length}</strong> of <strong>{total}</strong> verified listings
        </p>
      </div>

      {/* 4. Responsive 2-Column Mobile / Multi-Column Desktop Listings Grid */}
      {loading && items.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-2xl bg-white border border-slate-200 h-64 animate-pulse p-3 space-y-2.5">
              <div className="h-32 rounded-xl bg-slate-200" />
              <div className="h-3.5 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center">
          <p className="text-base sm:text-lg font-bold text-[#0a2458]">No matching listings found</p>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Try resetting filters or post a Real-Time Requirement so verified vendors contact you directly.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-slate-300 px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset Filters
            </button>
            <Link
              href="/requirements#post"
              className="rounded-full bg-[#f97316] text-white px-5 py-2 text-xs sm:text-sm font-semibold"
            >
              Post Requirement
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {items.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>

          {items.length < total && (
            <div className="mt-8 text-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => fetchFiltered(category, subcategory, q, sort, offset + limit, true)}
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
