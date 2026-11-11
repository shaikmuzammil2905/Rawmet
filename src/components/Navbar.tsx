"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Home,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Phone,
  ShoppingCart,
  Store,
  Tag,
  User,
  X,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

interface SessionSummary {
  authenticated: boolean;
  user: { id: number; name: string; role: UserRole; email: string } | null;
}

const PRODUCT_LINKS = [
  { label: "All Products", href: "/products" },
  { label: "Rubber", href: "/products/rubber" },
  { label: "Plastic", href: "/products/plastic" },
  { label: "Metals", href: "/products/metals" },
  { label: "Bio Petro Chemical", href: "/products/bio-petro-chemical" },
];

const MACHINERY_LINKS = [
  { label: "All Machineries", href: "/machineries" },
  { label: "Rubber Machineries", href: "/machineries/rubber-machineries" },
  { label: "Plastic Machineries", href: "/machineries/plastic-machineries" },
  { label: "Metals – Plants", href: "/machineries/metals-plants" },
  { label: "BPC – Plants", href: "/machineries/bpc-plants" },
  { label: "Vehicle – Fabrication – Bodybuilders", href: "/machineries/vehicle-fabrication" },
];

const SERVICE_LINKS = [
  { label: "All Services", href: "/services" },
  { label: "Manpower Services", href: "/services/manpower-services" },
  { label: "AMC", href: "/services/amc" },
  { label: "Maintenance Services", href: "/services/maintenance-services" },
  { label: "Mechanical Services", href: "/services/mechanical-services" },
  { label: "Logistics Services", href: "/services/logistics-services" },
  { label: "Loans Services", href: "/services/loans-services" },
  { label: "Business Registrations", href: "/services/business-registrations" },
  { label: "Website / App Services", href: "/services/website-app-services" },
];

const ABOUT_LINKS = [
  { label: "About Sriñidhi Enterprises", href: "/about" },
  { label: "Real-Time Opportunities", href: "/requirements" },
  { label: "Subscription Plans", href: "/subscriptions" },
  { label: "Promote Us • Grow With Us", href: "/promote" },
];

export function Navbar({ mobileNumber = "+91 7382177653" }: { mobileNumber?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [session, setSession] = useState<SessionSummary>({ authenticated: false, user: null });

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (active) setSession({ authenticated: Boolean(data.authenticated), user: data.user || null });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ authenticated: false, user: null });
    router.push("/");
    router.refresh();
  }

  const dashboardHref =
    session.user?.role === "admin"
      ? "/admin"
      : session.user?.role === "vendor"
        ? "/vendor/dashboard"
        : "/dashboard";

  const isHome = pathname === "/";

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 no-print">
        {/* Top Corporate Information Bar */}
        <div className="hidden lg:block bg-[#06183d] text-white/90 text-[11.5px] font-medium">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 flex items-center justify-between h-8">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Free – All Listings in Website
              </span>
              <span className="text-white/30">|</span>
              <span>GST Number / Authentic ID Required</span>
              <span className="text-white/30">|</span>
              <a
                href={`tel:${mobileNumber.replace(/\s+/g, "")}`}
                className="flex items-center gap-1 hover:text-orange-400 transition-colors"
              >
                <Phone className="h-3 w-3 text-orange-400" />
                Customer Support: <strong className="text-white">{mobileNumber}</strong>
              </a>
            </div>
            <div className="flex items-center gap-3.5">
              <Link href="/promote" className="text-orange-300 hover:text-orange-200 transition-colors">
                Promote Us • Grow With Us
              </Link>
              <span className="text-white/25">|</span>
              <Link href="/subscriptions" className="hover:text-orange-300 transition-colors">
                Launching Offer
              </Link>
              <span className="text-white/25">|</span>
              <Link href="/login" className="hover:text-white transition-colors">
                Login
              </Link>
            </div>
          </div>
        </div>

        {/* Main Navigation Row */}
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6">
          <div className="flex items-center justify-between h-[70px] lg:h-[78px] gap-3">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center shrink-0 py-1 pr-2 group focus:outline-none"
              aria-label="RAWMET MART Home"
            >
              <img
                src="/images/rawmet-logo.png"
                alt="RAWMET MART - Online Real-time Business Portal"
                className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.01]"
              />
            </Link>

            {/* Desktop Center Nav */}
            <nav className="hidden xl:flex items-center gap-1" aria-label="Main navigation">
              <Link
                href="/"
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  isHome
                    ? "bg-[#0a2458] text-white shadow-sm"
                    : "text-slate-700 hover:text-[#0a2458] hover:bg-slate-100"
                }`}
              >
                Home
              </Link>

              <NavDropdown
                label="About Us"
                active={pathname.startsWith("/about") || pathname.startsWith("/promote") || pathname.startsWith("/requirements")}
                items={ABOUT_LINKS}
                isOpen={openDropdown === "about"}
                onToggle={(open) => setOpenDropdown(open ? "about" : null)}
              />

              <NavDropdown
                label="Products"
                active={pathname.startsWith("/products")}
                items={PRODUCT_LINKS}
                isOpen={openDropdown === "products"}
                onToggle={(open) => setOpenDropdown(open ? "products" : null)}
              />

              <NavDropdown
                label="Machineries"
                active={pathname.startsWith("/machineries")}
                items={MACHINERY_LINKS}
                isOpen={openDropdown === "machineries"}
                onToggle={(open) => setOpenDropdown(open ? "machineries" : null)}
              />

              <NavDropdown
                label="Services"
                active={pathname.startsWith("/services")}
                items={SERVICE_LINKS}
                isOpen={openDropdown === "services"}
                onToggle={(open) => setOpenDropdown(open ? "services" : null)}
              />

              <Link
                href="/gallery"
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  pathname.startsWith("/gallery")
                    ? "bg-[#0a2458] text-white"
                    : "text-slate-700 hover:text-[#0a2458] hover:bg-slate-100"
                }`}
              >
                Gallery
              </Link>

              <Link
                href="/requirements"
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  pathname.startsWith("/requirements")
                    ? "bg-[#0a2458] text-white"
                    : "text-slate-700 hover:text-[#0a2458] hover:bg-slate-100"
                }`}
              >
                Requirements
              </Link>
            </nav>

            {/* Desktop Action CTAs */}
            <div className="hidden lg:flex items-center gap-2.5 shrink-0">
              <Link
                href="/vendor/register"
                className="inline-flex items-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-4 py-2 text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-[0.98]"
              >
                <Store className="h-4 w-4" />
                <span>Vendor Register</span>
              </Link>

              {session.authenticated && session.user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href={dashboardHref}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-4 py-2 text-sm font-semibold shadow-sm transition-all"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="max-w-[110px] truncate">{session.user.name.split(" ")[0]}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Logout"
                    aria-label="Logout"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-5 py-2 text-sm font-semibold shadow-sm hover:shadow transition-all active:scale-[0.98]"
                >
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>

            {/* Mobile Right Controls */}
            <div className="flex xl:hidden items-center gap-2">
              <Link
                href={session.authenticated ? dashboardHref : "/login"}
                className="hidden sm:inline-flex lg:hidden items-center gap-1.5 rounded-full bg-[#0a2458] text-white px-3.5 py-1.5 text-xs font-semibold"
              >
                <User className="h-3.5 w-3.5" />
                {session.authenticated ? "Account" : "Login"}
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                className="inline-flex items-center justify-center rounded-lg p-2 text-[#0a2458] hover:bg-blue-50 transition-colors"
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="xl:hidden border-t border-slate-200 bg-white max-h-[calc(100vh-70px)] overflow-y-auto shadow-xl">
            <div className="px-4 py-4 space-y-3">
              <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
                <Link
                  href="/vendor/register"
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 rounded-full bg-[#f97316] text-white px-4 py-2.5 text-sm font-semibold"
                >
                  <Store className="h-4 w-4" />
                  Vendor Register
                </Link>
                {session.authenticated ? (
                  <Link
                    href={dashboardHref}
                    className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 rounded-full bg-[#0a2458] text-white px-4 py-2.5 text-sm font-semibold"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="flex-1 min-w-[130px] inline-flex items-center justify-center gap-2 rounded-full bg-[#0a2458] text-white px-4 py-2.5 text-sm font-semibold"
                  >
                    <User className="h-4 w-4" />
                    Login
                  </Link>
                )}
              </div>

              <MobileNavGroup title="Main Navigation" items={[
                { label: "Home", href: "/" },
                { label: "Real-Time Requirements", href: "/requirements" },
                { label: "Subscription Plans & Offers", href: "/subscriptions" },
                { label: "Gallery", href: "/gallery" },
                { label: "About Sriñidhi Enterprises", href: "/about" },
                { label: "Promote Us • Grow With Us", href: "/promote" },
              ]} />
              <MobileNavGroup title="Products" items={PRODUCT_LINKS} />
              <MobileNavGroup title="Machineries" items={MACHINERY_LINKS} />
              <MobileNavGroup title="Services" items={SERVICE_LINKS} />

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-[#0a2458]">Verified GST Business Portal</span>
                <a href={`tel:${mobileNumber.replace(/\s+/g, "")}`} className="font-semibold text-[#f97316]">
                  Support: {mobileNumber}
                </a>
              </div>
              {session.authenticated && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full mt-2 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-700"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sticky Bottom Bar matching reference mobile UI */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a2458] text-white border-t border-white/10 shadow-[0_-4px_18px_rgba(10,36,88,0.28)] no-print"
      >
        <div className="grid grid-cols-4 h-16">
          <Link
            href="/"
            className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              pathname === "/" ? "text-white" : "text-blue-100/80"
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
            {pathname === "/" && <span className="absolute bottom-0 left-3 right-3 h-1 rounded-t bg-[#f97316]" />}
          </Link>

          <Link
            href="/products"
            className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold border-l border-white/15 ${
              pathname.startsWith("/products") || pathname.startsWith("/machineries")
                ? "text-white"
                : "text-blue-100/80"
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Buy</span>
            {(pathname.startsWith("/products") || pathname.startsWith("/machineries")) && (
              <span className="absolute bottom-0 left-3 right-3 h-1 rounded-t bg-[#f97316]" />
            )}
          </Link>

          <Link
            href={session.user?.role === "vendor" ? "/vendor/dashboard" : "/vendor/register"}
            className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold border-l border-white/15 ${
              pathname.startsWith("/vendor") ? "text-white" : "text-blue-100/80"
            }`}
          >
            <Tag className="h-5 w-5" />
            <span>Sell</span>
            {pathname.startsWith("/vendor") && (
              <span className="absolute bottom-0 left-3 right-3 h-1 rounded-t bg-[#f97316]" />
            )}
          </Link>

          <Link
            href="/about"
            className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold border-l border-white/15 ${
              pathname.startsWith("/about") ? "text-white" : "text-blue-100/80"
            }`}
          >
            <Info className="h-5 w-5" />
            <span>About Us</span>
            {pathname.startsWith("/about") && (
              <span className="absolute bottom-0 left-3 right-3 h-1 rounded-t bg-[#f97316]" />
            )}
          </Link>
        </div>
      </nav>
    </>
  );
}

function NavDropdown({
  label,
  items,
  active,
  isOpen,
  onToggle,
}: {
  label: string;
  items: { label: string; href: string }[];
  active: boolean;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}) {
  return (
    <div
      className="relative"
      onMouseEnter={() => onToggle(true)}
      onMouseLeave={() => onToggle(false)}
    >
      <button
        type="button"
        onClick={() => onToggle(!isOpen)}
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
          active
            ? "bg-[#0a2458] text-white"
            : "text-slate-700 hover:text-[#0a2458] hover:bg-slate-100"
        }`}
      >
        <span>{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full pt-1.5 w-64 z-50">
          <div className="rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-[#0a2458] font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileNavGroup({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  const [expanded, setExpanded] = useState(title === "Main Navigation");
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-bold text-[#0a2458]"
      >
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="px-2 pb-2 grid grid-cols-1 gap-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-700 hover:bg-white hover:text-[#0a2458] font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

