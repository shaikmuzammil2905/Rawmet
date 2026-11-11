"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Handshake, Headphones, Search, ShieldCheck, Zap } from "lucide-react";
import type { HeroSlide } from "@/lib/types";

const TRUST_PILLARS = [
  { label: "Trusted\nVendors", icon: Handshake },
  { label: "Secure\nTransactions", icon: ShieldCheck },
  { label: "Real-Time\nListings", icon: Zap },
  { label: "Dedicated\nSupport", icon: Headphones },
];

export function HeroSection({ slides }: { slides: HeroSlide[] }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState("");
  const touchStartX = useRef<number | null>(null);

  const safeSlides = slides.length > 0 ? slides : [
    {
      id: "default",
      eyebrow: "Online Real-time Business Portal",
      headlinePrefix: "Your Trusted Platform for\nIndustrial Business",
      headlineHighlight: "Solutions",
      subcategoriesLine: "Products  |  Machineries  |  Services",
      desktopImage: "/images/hero-desktop-1.png",
      mobileImage: "/images/hero-mobile-1.png",
      ctaLabel: "Explore",
      ctaHref: "/products",
    },
  ];

  useEffect(() => {
    if (safeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % safeSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [safeSlides.length]);

  const current = safeSlides[activeIndex] || safeSlides[0];
  const headlineLines = current.headlinePrefix.split("\n");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(diff) > 45) {
      if (diff < 0) setActiveIndex((prev) => (prev + 1) % safeSlides.length);
      else setActiveIndex((prev) => (prev - 1 + safeSlides.length) % safeSlides.length);
    }
    touchStartX.current = null;
  }

  return (
    <section
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden bg-[#dbeafe] min-h-[470px] sm:min-h-[450px] lg:min-h-[465px] flex items-center"
      aria-label="Hero showcase"
    >
      {/* Slide Backgrounds (Separate desktop & mobile backgrounds matching prompt requirements) */}
      {safeSlides.map((slide, idx) => {
        const isActive = idx === activeIndex;
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              isActive ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Desktop Background Image */}
            <img
              src={slide.desktopImage}
              alt=""
              className="hidden md:block h-full w-full object-cover object-right"
            />
            {/* Mobile Background Image */}
            <img
              src={slide.mobileImage}
              alt=""
              className="block md:hidden h-full w-full object-cover object-center"
            />
            {/* Contrast-preserving gradient overlays matching desktop/mobile reference */}
            <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#eff5ff] via-[#eef4ff]/90 via-45% to-transparent" />
            <div className="block md:hidden absolute inset-0 bg-gradient-to-b from-[#eff5ff]/95 via-[#eff5ff]/82 via-52% to-[#0a2458]/25" />
          </div>
        );
      })}

      {/* Hero Foreground Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 pt-7 pb-14 md:py-12">
        <div className="max-w-2xl">
          <h1 className="text-[26px] sm:text-4xl lg:text-[42px] font-extrabold leading-[1.16] tracking-tight text-[#0a2458]">
            {headlineLines.map((line, i) => (
              <span key={i} className={i === 0 ? "block font-medium text-[#0f2e6e] text-[22px] sm:text-3xl lg:text-[34px] mb-1" : "inline"}>
                {line}{" "}
              </span>
            ))}
            <span className="text-[#f97316]">{current.headlineHighlight}</span>
          </h1>

          <p className="mt-2.5 text-sm sm:text-lg font-bold tracking-wide text-[#13336e]">
            {current.subcategoriesLine}
          </p>

          {/* 4 Trust Indicators */}
          <div className="mt-5 grid grid-cols-4 sm:flex sm:items-center gap-1 sm:gap-0 max-w-xl bg-white/65 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none rounded-xl p-2 md:p-0 border border-white/60 md:border-none">
            {TRUST_PILLARS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`flex flex-col items-center text-center px-1 sm:px-4 ${
                    idx > 0 ? "border-l border-[#0a2458]/20" : ""
                  }`}
                >
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#1652b8] mb-1" strokeWidth={2} />
                  <span className="text-[10.5px] sm:text-xs font-semibold text-[#0a2458] leading-tight whitespace-pre-line">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="mt-5 sm:mt-6 flex items-center rounded-full bg-white p-1.5 shadow-[0_10px_30px_rgba(10,36,88,0.16)] border border-blue-100 max-w-xl"
          >
            <Search className="h-5 w-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, machineries or services..."
              aria-label="Search for products, machineries or services"
              className="w-full bg-transparent px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-5 sm:px-7 py-2.5 text-xs sm:text-sm font-bold shadow transition-all active:scale-[0.98] shrink-0"
            >
              Search
            </button>
          </form>

          {/* Quick filter chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[#0a2458]/80">
            <span className="text-slate-600 mr-1">Popular:</span>
            {["Rubber", "HDPE Granules", "SS Pipes", "Bio Diesel", "Injection Molding", "AMC"].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
                className="rounded-full bg-white/80 hover:bg-white border border-blue-100 px-2.5 py-0.5 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-5 md:bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {safeSlides.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveIndex(idx)}
            aria-label={`Show slide ${idx + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === activeIndex ? "w-7 bg-[#0a2458] shadow" : "w-2.5 bg-white/80 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

