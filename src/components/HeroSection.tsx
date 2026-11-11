"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Handshake,
  Headphones,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import type { HeroSlide } from "@/lib/types";
import { useToast } from "./ToastProvider";

const TRUST_PILLARS = [
  { label: "Trusted\nVendors", icon: Handshake },
  { label: "Secure\nTransactions", icon: ShieldCheck },
  { label: "Real-Time\nListings", icon: Zap },
  { label: "Dedicated\nSupport", icon: Headphones },
];

export function HeroSection({ slides }: { slides: HeroSlide[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeIndex, setActiveIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [reqName, setReqName] = useState("");
  const [reqMobile, setReqMobile] = useState("");
  const [reqCategory, setReqCategory] = useState("rubber");
  const [reqTitle, setReqTitle] = useState("");
  const [reqSending, setReqSending] = useState(false);
  const [reqDoneMsg, setReqDoneMsg] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const safeSlides =
    slides.length > 0
      ? slides
      : [
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

  async function submitQuickRequirement(e: React.FormEvent) {
    e.preventDefault();
    setReqSending(true);
    try {
      const res = await fetch("/api/requirements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reqName,
          mobile: reqMobile,
          categoryType: reqCategory.includes("machineries") || reqCategory.includes("plants") ? "machinery" : "product",
          categorySlug: reqCategory,
          title: reqTitle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Unable to post requirement.", "error");
        return;
      }
      setReqDoneMsg(data.message);
      showToast(data.message, "success");
    } finally {
      setReqSending(false);
    }
  }

  return (
    <>
      <section
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden bg-[#dbeafe] min-h-[500px] sm:min-h-[460px] lg:min-h-[470px] flex items-center"
        aria-label="Hero showcase"
      >
        {/* Slide Backgrounds (Desktop + Bright Vivid Mobile Hero) */}
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
              {/* Mobile Background Image - Bright, Crisp & Vivid */}
              <img
                src={slide.mobileImage}
                alt=""
                className="block md:hidden h-full w-full object-cover object-bottom brightness-105 contrast-105 saturate-110"
              />
              {/* Desktop contrast gradient */}
              <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#eff5ff] via-[#eef4ff]/88 via-44% to-transparent" />
              {/* Mobile lightweight top-scrim only so the refinery, sky, pipes & granules stay bright and vivid */}
              <div className="block md:hidden absolute inset-0 bg-gradient-to-b from-white/80 via-[#eff5ff]/38 via-42% to-transparent" />
            </div>
          );
        })}

        {/* Hero Foreground Content */}
        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 sm:px-6 pt-6 pb-14 md:py-12">
          <div className="max-w-2xl animate-popIn">
            <h1 className="text-[25px] sm:text-4xl lg:text-[42px] font-extrabold leading-[1.16] tracking-tight text-[#0a2458] drop-shadow-[0_1px_10px_rgba(255,255,255,0.9)]">
              {headlineLines.map((line, i) => (
                <span
                  key={i}
                  className={
                    i === 0
                      ? "block font-semibold text-[#0f2e6e] text-[20px] sm:text-3xl lg:text-[34px] mb-1"
                      : "inline"
                  }
                >
                  {line}{" "}
                </span>
              ))}
              <span className="text-[#f97316]">{current.headlineHighlight}</span>
            </h1>

            <p className="mt-2 text-sm sm:text-lg font-bold tracking-wide text-[#0a2458] drop-shadow-[0_1px_8px_rgba(255,255,255,0.95)]">
              {current.subcategoriesLine}
            </p>

            {/* 4 Trust Indicators */}
            <div className="mt-4 sm:mt-5 grid grid-cols-4 sm:flex sm:items-center gap-1 sm:gap-0 max-w-xl bg-white/85 md:bg-transparent backdrop-blur-md md:backdrop-blur-none rounded-2xl p-2.5 md:p-0 border border-white/80 md:border-none shadow-sm md:shadow-none">
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
                    <span className="text-[10px] sm:text-xs font-bold text-[#0a2458] leading-tight whitespace-pre-line">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="mt-4 sm:mt-6 flex items-center rounded-full bg-white p-1.5 shadow-[0_12px_32px_rgba(10,36,88,0.2)] border border-blue-100 max-w-xl"
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, machineries, services..."
                aria-label="Search for products, machineries or services"
                className="w-full min-w-0 bg-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-4 sm:px-7 py-2.5 text-xs sm:text-sm font-bold shadow transition-all active:scale-[0.98] shrink-0"
              >
                Search
              </button>
            </form>

            {/* Quick filter chips + Quick Popup Trigger */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[#0a2458]">
              <button
                type="button"
                onClick={() => {
                  setReqDoneMsg(null);
                  setQuickModalOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-3 py-1 font-bold shadow-sm transition-all"
              >
                <Sparkles className="h-3 w-3" />
                Quick Requirement Popup
              </button>
              {["Rubber", "HDPE Granules", "SS Pipes", "Bio Diesel", "AMC"].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => router.push(`/search?q=${encodeURIComponent(tag)}`)}
                  className="rounded-full bg-white/90 hover:bg-white border border-blue-100 px-2.5 py-1 shadow-xs transition-colors"
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
                idx === activeIndex ? "w-7 bg-[#0a2458] shadow" : "w-2.5 bg-white/90 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Quick Requirement Popup Modal */}
      {quickModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[95] bg-[#06183d]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setQuickModalOpen(false)}
        >
          <div
            className="relative max-w-lg w-full rounded-3xl bg-white shadow-2xl overflow-hidden animate-popIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#0a2458] to-[#123983] p-5 text-white flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-orange-300">
                  Real-Time WhatsApp Alert Portal
                </p>
                <h3 className="text-lg font-extrabold">Post Quick Requirement</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickModalOpen(false)}
                aria-label="Close popup"
                className="rounded-full bg-white/15 p-1.5 hover:bg-white/25"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {reqDoneMsg ? (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3 text-sm text-emerald-900">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="font-semibold">{reqDoneMsg}</p>
                  </div>
                  <Link
                    href="/requirements"
                    onClick={() => setQuickModalOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#0a2458] text-white py-2.5 text-sm font-bold"
                  >
                    <span>View Live Requirements Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={submitQuickRequirement} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      placeholder="Your Name *"
                      className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                    />
                    <input
                      type="tel"
                      required
                      value={reqMobile}
                      onChange={(e) => setReqMobile(e.target.value)}
                      placeholder="10-Digit Mobile *"
                      className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                    />
                  </div>
                  <select
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    aria-label="Category"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white"
                  >
                    <option value="rubber">Rubber Products</option>
                    <option value="plastic">Plastic Granules &amp; Polymers</option>
                    <option value="metals">Metals &amp; Steel Pipes</option>
                    <option value="bio-petro-chemical">Bio Petro Chemical</option>
                    <option value="rubber-machineries">Rubber Machineries</option>
                    <option value="plastic-machineries">Plastic Machineries</option>
                    <option value="metals-plants">Metals – Plants</option>
                    <option value="bpc-plants">BPC – Plants</option>
                    <option value="amc">Industrial AMC &amp; Services</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={reqTitle}
                    onChange={(e) => setReqTitle(e.target.value)}
                    placeholder="What do you need? (e.g. 5 MT HDPE Granules) *"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-[#1652b8] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={reqSending}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white py-3 text-sm font-bold shadow"
                  >
                    <Send className="h-4 w-4" />
                    <span>{reqSending ? "Notifying Vendors..." : "Post & Notify Vendors"}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
