"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";

export function Footer({
  mobile = "+91 7382177653",
  whatsapp = "917382177653",
  email = "support@rawmet.com",
}: {
  mobile?: string;
  whatsapp?: string;
  email?: string;
}) {
  const rawPathname = usePathname();
  const pathname = rawPathname || "";

  // Hide public footer only in Super Admin and Vendor Portal dashboards
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/vendor/dashboard")
  ) {
    return null;
  }

  const SOCIAL_LINKS = [
    { name: "LinkedIn", href: "https://linkedin.com/company/rawmet-enterprises", icon: Linkedin, color: "hover:bg-[#0077b5] hover:text-white" },
    { name: "Twitter / X", href: "https://twitter.com/rawmet_b2b", icon: Twitter, color: "hover:bg-[#1da1f2] hover:text-white" },
    { name: "Facebook", href: "https://facebook.com/rawmet.india", icon: Facebook, color: "hover:bg-[#1877f2] hover:text-white" },
    { name: "Instagram", href: "https://instagram.com/rawmet_official", icon: Instagram, color: "hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white" },
    { name: "YouTube", href: "https://youtube.com/@rawmet-industrial", icon: Youtube, color: "hover:bg-[#ff0000] hover:text-white" },
    { name: "WhatsApp", href: `https://wa.me/${whatsapp.replace(/\D/g, "")}`, icon: MessageCircle, color: "hover:bg-[#25d366] hover:text-white" },
  ];

  return (
    <footer className="bg-[#06183d] text-slate-200 pb-20 lg:pb-0 no-print">
      {/* Promote Us CTA Banner */}
      <div className="border-b border-white/10 bg-gradient-to-r from-[#0a2458] via-[#0f3478] to-[#0a2458]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
              RAWMAT MART — Online Real-time B2B, B2C, C2C, D2C Portal
            </p>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
              Promote Us • Grow With Us — Earn Rewards Referring Verified Industrial Vendors
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/promote"
              className="inline-flex items-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-5 py-2.5 text-sm font-semibold shadow transition-all"
            >
              <span>Become a Promotion Partner</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/requirements"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 text-sm font-semibold transition-all"
            >
              Post Requirement
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Link href="/" className="inline-block">
            <img
              src="/images/rawmet-logo-footer.png"
              alt="RAWMAT MART - Online Real-time B2B, B2C, C2C, D2C Portal"
              className="h-11 sm:h-12 w-auto object-contain"
            />
          </Link>
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
            <strong className="text-white">RAWMAT MART — Online Real-time B2B, B2C, C2C, D2C Portal</strong> operated by{" "}
            <strong className="text-white">Sirrinidhi Enterprises</strong>. Connecting verified Indian manufacturers,
            raw material suppliers, machinery OEMs, and industrial service providers.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={`tel:${mobile.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
            >
              <Phone className="h-3.5 w-3.5 text-orange-400" />
              {mobile}
            </a>
            <a
              href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp Support
            </a>
          </div>

          {/* Social Media Links */}
          <div className="pt-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Connect With Us Online
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {SOCIAL_LINKS.map((soc) => {
                const Icon = soc.icon;
                return (
                  <a
                    key={soc.name}
                    href={soc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow Rawmat Mart on ${soc.name}`}
                    title={soc.name}
                    className={`h-9 w-9 rounded-full bg-white/10 text-slate-200 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-sm ${soc.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link href="/about" className="hover:text-orange-400 transition-colors">About Us</Link></li>
            <li><Link href="/gallery" className="hover:text-orange-400 transition-colors">Gallery</Link></li>
            <li><Link href="/requirements" className="hover:text-orange-400 transition-colors">Real-Time Portal</Link></li>
            <li><Link href="/subscriptions" className="hover:text-orange-400 transition-colors">Launching Offer</Link></li>
            <li><Link href="/promote" className="hover:text-orange-400 transition-colors">Promote Us • Grow With Us</Link></li>
            <li><Link href="/about#contact" className="hover:text-orange-400 transition-colors">Contact</Link></li>
          </ul>
        </div>

        {/* Products */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Products</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link href="/products/rubber" className="hover:text-orange-400 transition-colors">Rubber</Link></li>
            <li><Link href="/products/plastic" className="hover:text-orange-400 transition-colors">Plastic</Link></li>
            <li><Link href="/products/metals" className="hover:text-orange-400 transition-colors">Metals</Link></li>
            <li><Link href="/products/bio" className="hover:text-orange-400 transition-colors">Bio</Link></li>
            <li><Link href="/products/petrolium" className="hover:text-orange-400 transition-colors">Petrolium</Link></li>
            <li><Link href="/products/chemical" className="hover:text-orange-400 transition-colors">Chemical</Link></li>
            <li><Link href="/products/coco-pet" className="hover:text-orange-400 transition-colors">Coco pet</Link></li>
          </ul>
        </div>

        {/* Industry */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Industry</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link href="/machineries/rubber-machineries" className="hover:text-orange-400 transition-colors">Rubber</Link></li>
            <li><Link href="/machineries/plastic-machineries" className="hover:text-orange-400 transition-colors">Plastic</Link></li>
            <li><Link href="/machineries/metals-plants" className="hover:text-orange-400 transition-colors">Metals - Plants</Link></li>
            <li><Link href="/machineries/bio-plant" className="hover:text-orange-400 transition-colors">Bio plant</Link></li>
            <li><Link href="/machineries/petrolium-plant" className="hover:text-orange-400 transition-colors">Petrolium Plant</Link></li>
            <li><Link href="/machineries/chemical-plants" className="hover:text-orange-400 transition-colors">Chemical - Plants</Link></li>
            <li><Link href="/machineries/coconut-process-machinery" className="hover:text-orange-400 transition-colors">Coconut Process -mechineary</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Services</h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li><Link href="/services/manpower-services" className="hover:text-orange-400 transition-colors">Manpower Services</Link></li>
            <li><Link href="/services/amc-services" className="hover:text-orange-400 transition-colors">AMC Services</Link></li>
            <li><Link href="/services/maintenance-services" className="hover:text-orange-400 transition-colors">Maintenance Services</Link></li>
            <li><Link href="/services/mechanical-services" className="hover:text-orange-400 transition-colors">Mechanical Services</Link></li>
            <li><Link href="/services/logistics-services" className="hover:text-orange-400 transition-colors">Logistics Services</Link></li>
            <li><Link href="/services/loans-services" className="hover:text-orange-400 transition-colors">Loans Services</Link></li>
            <li><Link href="/services/business-registrations" className="hover:text-orange-400 transition-colors">Registrations - GST, Partnership, Pvt Ltd</Link></li>
            <li><Link href="/services/website-app-services" className="hover:text-orange-400 transition-colors">Website/ App Services</Link></li>
            <li><Link href="/services/import-export-services" className="hover:text-orange-400 transition-colors">Import & Export Services</Link></li>
            <li><Link href="/services/vehicle-fabrication-services" className="hover:text-orange-400 transition-colors">Vehicle -Fabrication -Services</Link></li>
            <li><Link href="/services/insurance-services" className="hover:text-orange-400 transition-colors">Insurance - Services</Link></li>
            <li><Link href="/services/consultant-services" className="hover:text-orange-400 transition-colors">Consultant - Services</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal Strip */}
      <div className="border-t border-white/10 bg-[#04112c]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} RAWMAT MART — Sirrinidhi Enterprises. All Rights Reserved.</p>
          <div className="flex items-center gap-3">
            <span>GST / Authentic ID Verification • Multi-Vendor B2B Industrial Marketplace</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
