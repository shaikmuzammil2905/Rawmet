"use client";

import React, { useState } from "react";
import { X, ZoomIn } from "lucide-react";

interface GalleryItem {
  id: number;
  title: string;
  category: string;
  image_url: string;
  caption: string;
}

export function GalleryClient({ items }: { items: GalleryItem[] }) {
  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category)))];
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const visible =
    selectedCategory === "All" ? items : items.filter((i) => i.category === selectedCategory);

  return (
    <div>
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              selectedCategory === cat
                ? "bg-[#0a2458] text-white shadow"
                : "bg-white border border-slate-200 text-slate-700 hover:border-[#0a2458]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-sm text-slate-600">
          No gallery images in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxItem(item)}
              className="group text-left rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-[#0a2458]/0 group-hover:bg-[#0a2458]/35 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#0a2458] shadow">
                    <ZoomIn className="h-4 w-4 text-[#f97316]" />
                    View Image
                  </span>
                </div>
                <span className="absolute top-3 left-3 rounded-full bg-[#0a2458]/90 text-white px-2.5 py-0.5 text-[11px] font-bold">
                  {item.category}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-bold text-[#0a2458]">{item.title}</h3>
                {item.caption && <p className="mt-1 text-xs text-slate-600 line-clamp-2">{item.caption}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-w-4xl w-full rounded-3xl bg-white overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxItem(null)}
              aria-label="Close lightbox"
              className="absolute top-3 right-3 z-10 rounded-full bg-white/90 hover:bg-white p-2 text-slate-800 shadow"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="bg-slate-950 max-h-[70vh] flex items-center justify-center overflow-hidden">
              <img
                src={lightboxItem.image_url}
                alt={lightboxItem.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="p-5">
              <span className="text-xs font-bold uppercase text-[#f97316]">{lightboxItem.category}</span>
              <h3 className="text-lg font-extrabold text-[#0a2458] mt-0.5">{lightboxItem.title}</h3>
              {lightboxItem.caption && <p className="text-sm text-slate-600 mt-1">{lightboxItem.caption}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

