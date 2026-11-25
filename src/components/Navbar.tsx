"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Home,
  Info,
  LogOut,
  Menu,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Tag,
  User,
  X,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

interface SessionSummary {
  authenticated: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  } | null;
}

const PRODUCT_LINKS = [
  { label: "All Products", href: "/products" },
  { label: "Rubber", href: "/products/rubber" },
  { label: "Plastic", href: "/products/plastic" },
  { label: "Metals", href: "/products/metals" },
  { label: "Bio", href: "/products/bio" },
  { label: "Petrolium", href: "/products/petrolium" },
  { label: "Chemical", href: "/products/chemical" },
  { label: "Coco pet", href: "/products/coco-pet" },
];

const MACHINERY_LINKS = [
  { label: "All Industry", href: "/machineries" },
  { label: "Rubber", href: "/machineries/rubber-machineries" },
  { label: "Plastic", href: "/machineries/plastic-machineries" },
  { label: "Metals – Plants", href: "/machineries/metals-plants" },
  { label: "Bio plant", href: "/machineries/bio-plant" },
  { label: "Petrolium Plant", href: "/machineries/petrolium-plant" },
  { label: "Chemical – Plants", href: "/machineries/chemical-plants" },
  { label: "Coconut Process -mechineary", href: "/machineries/coconut-process-machinery" },
];

const SERVICE_LINKS = [
  { label: "All Services", href: "/services" },
  { label: "Manpower Services", href: "/services/manpower-services" },
  { label: "AMC Services", href: "/services/amc-services" },
  { label: "Maintenance Services", href: "/services/maintenance-services" },
  { label: "Mechanical Services", href: "/services/mechanical-services" },
  { label: "Logistics Services", href: "/services/logistics-services" },
  { label: "Loans Services", href: "/services/loans-services" },
  { label: "Registrations – GST, Partnership, Pvt Ltd", href: "/services/business-registrations" },
  { label: "Website/ App Services", href: "/services/website-app-services" },
  { label: "Import & Export Services", href: "/services/import-export-services" },
  { label: "Vehicle -Fabrication -Services", href: "/services/vehicle-fabrication-services" },
  { label: "Insurance - Services", href: "/services/insurance-services" },
  { label: "Consultant - Services", href: "/services/consultant-services" },
];

const SHOP_LINKS = [
  { label: "Products Catalog (Rubber, Plastic, Metals...)", href: "/products" },
  { label: "Industry & Turnkey Plants", href: "/machineries" },
  { label: "Industrial Services (AMC, Logistics, Loans...)", href: "/services" },
];

const ABOUT_LINKS = [
  { label: "About Sirrinidhi Enterprises", href: "/about" },
  { label: "Our Mission & Verification Standards", href: "/about#standards" },
  { label: "Management & Corporate Office", href: "/about#office" },
  { label: "Contact Customer Support", href: "/about#contact" },
  { label: "Promote Us • Grow With Us", href: "/promote" },
];

const SELL_LINKS = [
  { label: "Seller Business Registration (Free GST Listing)", href: "/vendor/register" },
  { label: "Seller Login (Seller Portal)", href: "/seller/login" },
];

export function Navbar({ mobileNumber = "+91 7382177653" }: { mobileNumber?: string }) {
  const rawPathname = usePathname();
  const pathname = rawPathname || "";
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [session, setSession] = useState<SessionSummary>({ authenticated: false, user: null });
  const [productLinks, setProductLinks] = useState(PRODUCT_LINKS);
  const [machineryLinks, setMachineryLinks] = useState(MACHINERY_LINKS);
  const [serviceLinks, setServiceLinks] = useState(SERVICE_LINKS);

  useEffect(() => {
    let active = true;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (!active || !Array.isArray(data?.categories)) return;
        const prod = data.categories.filter((c: { type: string; name: string; slug: string }) => c.type === "product");
        const mach = data.categories.filter((c: { type: string; name: string; slug: string }) => c.type === "machinery");
        const serv = data.categories.filter((c: { type: string; name: string; slug: string }) => c.type === "service");

        if (prod.length > 0) {
          setProductLinks([
            { label: "All Products", href: "/products" },
            ...prod.map((c: { name: string; slug: string }) => ({ label: c.name, href: `/products/${c.slug}` })),
          ]);
        }
        if (mach.length > 0) {
          setMachineryLinks([
            { label: "All Industry", href: "/machineries" },
            ...mach.map((c: { name: string; slug: string }) => ({ label: c.name, href: `/machineries/${c.slug}` })),
          ]);
        }
        if (serv.length > 0) {
          setServiceLinks([
            { label: "All Services", href: "/services" },
            ...serv.map((c: { name: string; slug: string }) => ({ label: c.name, href: `/services/${c.slug}` })),
          ]);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (pathname.startsWith("/admin") || pathname.startsWith("/vendor/dashboard")) {
      return;
    }
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

  // Completely hide header on Super Admin and Vendor Portal dashboards as requested
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/vendor/dashboard")
  ) {
    return null;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ authenticated: false, user: null });
    router.push("/");
    router.refresh();
  }

  const dashboardHref =
    session.user?.role === "admin"
      ? "/admin/dashboard"
      : session.user?.role === "vendor"
        ? "/vendor/dashboard"
        : "/dashboard";

  const isHome = pathname === "/";

  return (
    <>
      <header className="sticky top-0 z-50 w-full max-w-full overflow-visible bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 no-print">
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
              <Link href="/seller/login" className="text-orange-300 hover:text-white transition-colors font-bold">
                Seller Login
              </Link>
              <span className="text-white/25">|</span>
              <Link href="/login" prefetch={true} className="hover:text-white transition-colors font-semibold">
                Login
              </Link>
              {session.authenticated && (
                <>
                  <span className="text-white/25">|</span>
                  <Link href={dashboardHref} className="text-orange-300 hover:text-white transition-colors font-bold">
                    {session.user?.name ? `Hi, ${session.user.name.split(" ")[0]}` : "Dashboard"}
                  </Link>
                  <span className="text-white/25">|</span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-slate-300 hover:text-red-400 transition-colors font-semibold"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Navigation Row */}
        <div className="mx-auto max-w-[1400px] w-full px-3 sm:px-6">
          <div className="flex items-center justify-between h-[64px] sm:h-[70px] lg:h-[78px] gap-2 max-w-full">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center shrink min-w-0 py-1 pr-1 group focus:outline-none"
              aria-label="RAWMAT MART Home"
            >
              <img
                src="/images/rawmet-logo.png"
                alt="RAWMAT MART"
                className="h-8 sm:h-10 lg:h-12 w-auto max-w-[150px] sm:max-w-none object-contain transition-transform duration-200 group-hover:scale-[1.01]"
              />
            </Link>

            {/* Desktop Center Nav: featuring Home, Shop, Sell, About Us, Products, Industry, Services, Requirements, Gallery */}
            <nav className="hidden xl:flex items-center gap-1" aria-label="Main navigation">
              <Link
                href="/"
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  isHome
                    ? "bg-[#0a2458] text-white shadow-sm"
                    : "text-slate-700 hover:text-[#0a2458] hover:bg-slate-100"
                }`}
              >
                Home
              </Link>

              <NavDropdown
                label="Shop"
                href="/products"
                active={pathname.startsWith("/products") || pathname.startsWith("/machineries") || pathname.startsWith("/services")}
                items={SHOP_LINKS}
                isOpen={openDropdown === "shop"}
                onToggle={(open) => setOpenDropdown(open ? "shop" : null)}
              />

              <NavDropdown
                label="Sell"
                href="/seller"
                active={pathname.startsWith("/vendor") || pathname.startsWith("/seller")}
                items={
                  session.user?.role === "vendor"
                    ? [
                        { label: "Seller Dashboard", href: "/vendor/dashboard" },
                        { label: "Seller Registration", href: "/vendor/register" },
                      ]
                    : SELL_LINKS
                }
                isOpen={openDropdown === "sell"}
                onToggle={(open) => setOpenDropdown(open ? "sell" : null)}
              />

              <NavDropdown
                label="Products"
                href="/products"
                active={pathname.startsWith("/products")}
                items={productLinks}
                isOpen={openDropdown === "products"}
                onToggle={(open) => setOpenDropdown(open ? "products" : null)}
              />

              <NavDropdown
                label="Industry"
                href="/machineries"
                active={pathname.startsWith("/machineries")}
                items={machineryLinks}
                isOpen={openDropdown === "machineries"}
                onToggle={(open) => setOpenDropdown(open ? "machineries" : null)}
              />

              <NavDropdown
                label="Services"
                href="/services"
                active={pathname.startsWith("/services")}
                items={serviceLinks}
                isOpen={openDropdown === "services"}
                onToggle={(open) => setOpenDropdown(open ? "services" : null)}
              />

              <Link
                href="/requirements"
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  pathname.startsWith("/requirements")
                    ? "bg-[#0a2458] text-white"
                    : "text-slate-700 hover:text-[#0a2458] hover:bg-slate-100"
                }`}
              >
                Requirements
              </Link>

              <Link
                href="/gallery"
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  pathname.startsWith("/gallery")
                    ? "bg-[#0a2458] text-white"
                    : "text-slate-700 hover:text-[#0a2458] hover:bg-slate-100"
                }`}
              >
                Gallery
              </Link>

              <NavDropdown
                label="About Us"
                href="/about"
                active={pathname.startsWith("/about") || pathname.startsWith("/promote")}
                items={ABOUT_LINKS}
                isOpen={openDropdown === "about"}
                onToggle={(open) => setOpenDropdown(open ? "about" : null)}
              />
            </nav>

            {/* Desktop Action CTAs: User Login / Seller Login / Dashboard button */}
            <div className="hidden xl:flex items-center gap-2.5 shrink-0">
              {session.authenticated ? (
                <>
                  <Link
                    href={dashboardHref}
                    prefetch={true}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-4 py-2 text-sm font-bold shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
                  >
                    <User className="h-4 w-4 text-[#f97316]" />
                    <span className="truncate max-w-[130px]">
                      {session.user?.name ? session.user.name.split(" ")[0] : "Dashboard"}
                    </span>
                  </Link>
                  <Link
                    href="/login"
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 hover:border-[#0a2458] bg-white hover:bg-slate-50 text-[#0a2458] px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
                    title="Sign in with different account"
                  >
                    <span>Login</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Logout"
                    aria-label="Logout"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-red-600 transition-colors shadow-sm active:scale-95 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    prefetch={true}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-5 py-2 text-sm font-bold shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
                    aria-label="User Login"
                  >
                    <User className="h-4 w-4 text-[#f97316]" />
                    <span>Login</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Right Controls - Compact, Responsive & Non-Overflowing */}
            <div className="flex xl:hidden items-center gap-1.5 shrink-0">
              <Link
                href="/login"
                prefetch={true}
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-1 rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-3 py-1.5 text-xs font-bold active:scale-95 transition-all shadow-sm cursor-pointer"
                aria-label="User Login"
              >
                <User className="h-3.5 w-3.5 text-[#f97316] shrink-0" />
                <span>{session.authenticated ? (session.user?.name ? (session.user.name.length > 7 ? "Account" : session.user.name.split(" ")[0]) : "Account") : "Login"}</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                className="inline-flex items-center justify-center rounded-lg p-1.5 text-[#0a2458] hover:bg-blue-50 transition-colors shrink-0 cursor-pointer"
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
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
                <Link
                  href="/login"
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#0a2458] text-white px-3 py-2.5 text-xs font-bold shadow active:scale-95 cursor-pointer"
                >
                  <User className="h-3.5 w-3.5 text-[#f97316]" />
                  <span>{session.authenticated ? "User Login / Switch" : "User Login"}</span>
                </Link>
                <Link
                  href="/seller/login"
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-[#f97316] text-white px-3 py-2.5 text-xs font-bold shadow active:scale-95 cursor-pointer"
                >
                  <Tag className="h-3.5 w-3.5" />
                  <span>Seller Login</span>
                </Link>
              </div>

              {session.authenticated && (
                <div className="pb-2 border-b border-slate-100">
                  <Link
                    href={dashboardHref}
                    prefetch={true}
                    onClick={() => setMobileOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-[#0a2458] text-[#0a2458] hover:bg-blue-50 px-4 py-2 text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
                  >
                    <User className="h-3.5 w-3.5 text-[#f97316]" />
                    <span>Go to My Dashboard ({session.user?.role?.toUpperCase()}) →</span>
                  </Link>
                </div>
              )}

              <MobileNavGroup
                title="Seller Portal"
                onItemClick={() => setMobileOpen(false)}
                items={[
                  { label: "Seller Business Registration", href: "/vendor/register" },
                  { label: "Seller Login", href: "/seller/login" },
                ]}
              />
              <MobileNavGroup
                title="Main Navigation"
                onItemClick={() => setMobileOpen(false)}
                items={[
                  { label: "Home", href: "/" },
                  { label: "Shop (All Products, Industry, Services)", href: "/products" },
                  { label: "Sell on RAWMAT", href: "/vendor/register" },
                  { label: "Real-Time Requirements", href: "/requirements" },
                  { label: "Subscription Plans & Offers", href: "/subscriptions" },
                  { label: "Gallery", href: "/gallery" },
                  { label: "About Sirrinidhi Enterprises", href: "/about" },
                  { label: "Promote Us • Grow With Us", href: "/promote" },
                ]}
              />
              <MobileNavGroup title="Products" onItemClick={() => setMobileOpen(false)} items={productLinks} />
              <MobileNavGroup title="Industry" onItemClick={() => setMobileOpen(false)} items={machineryLinks} />
              <MobileNavGroup title="Services" onItemClick={() => setMobileOpen(false)} items={serviceLinks} />

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-[#0a2458]">Verified GST Business Portal</span>
                <a href={`tel:${mobileNumber.replace(/\s+/g, "")}`} className="font-semibold text-[#f97316]">
                  Support: {mobileNumber}
                </a>
              </div>
              {session.authenticated && (
                <button
                  type="button"
                  onClick={async () => {
                    setMobileOpen(false);
                    await handleLogout();
                  }}
                  className="w-full mt-2 rounded-lg border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-700 cursor-pointer"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sticky Bottom Bar matching reference mobile UI (Home, Shop, Sell, About Us) */}
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
              pathname.startsWith("/products") ||
              pathname.startsWith("/machineries") ||
              pathname.startsWith("/services")
                ? "text-white"
                : "text-blue-100/80"
            }`}
          >
            <ShoppingBag className="h-5 w-5" />
            <span>Shop</span>
            {(pathname.startsWith("/products") ||
              pathname.startsWith("/machineries") ||
              pathname.startsWith("/services")) && (
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
  href,
  active,
  items,
  isOpen,
  onToggle,
}: {
  label: string;
  href: string;
  active: boolean;
  items: Array<{ label: string; href: string }>;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}) {
  return (
    <div
      className="relative"
      onMouseEnter={() => onToggle(true)}
      onMouseLeave={() => onToggle(false)}
    >
      <Link
        href={href}
        onClick={() => onToggle(false)}
        aria-expanded={isOpen}
        className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1 cursor-pointer ${
          active
            ? "bg-[#0a2458] text-white shadow-sm"
            : "text-slate-700 hover:text-[#0a2458] hover:bg-slate-100"
        }`}
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </Link>

      {isOpen && (
        <div className="absolute top-full left-0 pt-2 z-50 min-w-[240px]">
          <div className="rounded-2xl bg-white shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => onToggle(false)}
                className="block px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-orange-50 hover:text-[#f97316] transition-colors"
              >
                {it.label}
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
  onItemClick,
}: {
  title: string;
  items: Array<{ label: string; href: string }>;
  onItemClick?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 pb-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-2 text-sm font-bold text-slate-800"
      >
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pl-3 py-1 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={onItemClick}
              className="block py-1.5 text-xs font-semibold text-slate-600 hover:text-[#f97316] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
