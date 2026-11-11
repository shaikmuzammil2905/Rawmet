import Link from "next/link";
import { ArrowRight, MessageCircle, Phone, ShieldCheck } from "lucide-react";

export function Footer({
  mobile = "+91 7382177653",
  whatsapp = "917382177653",
  email = "support@rawmet.com",
}: {
  mobile?: string;
  whatsapp?: string;
  email?: string;
}) {
  return (
    <footer className="bg-[#06183d] text-slate-200 pb-20 lg:pb-0 no-print">
      {/* Promote Us CTA Banner */}
      <div className="border-b border-white/10 bg-gradient-to-r from-[#0a2458] via-[#0f3478] to-[#0a2458]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
              RAWMET.com — Online Real-time Business Portal
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
          <div className="inline-block rounded-xl bg-white p-2.5 shadow-sm">
            <img
              src="/images/rawmet-logo.png"
              alt="RAWMET.com"
              className="h-10 w-auto object-contain"
            />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
            <strong className="text-white">RAWMET.com — Online Real-time Business Portal</strong> operated by{" "}
            <strong className="text-white">Sriñidhi Enterprises</strong>. Connecting verified Indian manufacturers,
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
            <li><Link href="/products/bio-petro-chemical" className="hover:text-orange-400 transition-colors">Bio Petro Chemical</Link></li>
          </ul>

          <h4 className="text-sm font-bold text-white uppercase tracking-wider mt-6 mb-3">Machineries</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link href="/machineries/rubber-machineries" className="hover:text-orange-400 transition-colors">Rubber</Link></li>
            <li><Link href="/machineries/plastic-machineries" className="hover:text-orange-400 transition-colors">Plastic</Link></li>
            <li><Link href="/machineries/metals-plants" className="hover:text-orange-400 transition-colors">Metals Plants</Link></li>
            <li><Link href="/machineries/bpc-plants" className="hover:text-orange-400 transition-colors">BPC Plants</Link></li>
            <li><Link href="/machineries/vehicle-fabrication" className="hover:text-orange-400 transition-colors">Vehicle Fabrication</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Services</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li><Link href="/services/manpower-services" className="hover:text-orange-400 transition-colors">Manpower</Link></li>
            <li><Link href="/services/amc" className="hover:text-orange-400 transition-colors">AMC</Link></li>
            <li><Link href="/services/maintenance-services" className="hover:text-orange-400 transition-colors">Maintenance</Link></li>
            <li><Link href="/services/mechanical-services" className="hover:text-orange-400 transition-colors">Mechanical</Link></li>
            <li><Link href="/services/logistics-services" className="hover:text-orange-400 transition-colors">Logistics</Link></li>
            <li><Link href="/services/loans-services" className="hover:text-orange-400 transition-colors">Loans</Link></li>
            <li><Link href="/services/business-registrations" className="hover:text-orange-400 transition-colors">Business Registrations</Link></li>
            <li><Link href="/services/website-app-services" className="hover:text-orange-400 transition-colors">Website / App Services</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Support</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>
              <a href={`tel:${mobile.replace(/\s+/g, "")}`} className="hover:text-orange-400 transition-colors">
                Customer Support
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-orange-400 transition-colors"
              >
                WhatsApp
              </a>
            </li>
            <li><Link href="/vendor/register" className="hover:text-orange-400 transition-colors">Vendor Registration</Link></li>
            <li><Link href="/login" className="hover:text-orange-400 transition-colors">Login</Link></li>
            <li>
              <Link href="/admin/login" className="inline-flex items-center gap-1 text-blue-200 hover:text-orange-400 transition-colors">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Login
              </Link>
            </li>
          </ul>
          <p className="mt-4 text-xs text-slate-400">
            Email: <a href={`mailto:${email}`} className="text-slate-200 hover:underline">{email}</a>
          </p>
        </div>
      </div>

      {/* Bottom Legal Strip */}
      <div className="border-t border-white/10 bg-[#04112c]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} RAWMET.com — Sriñidhi Enterprises. All Rights Reserved.</p>
          <p>GST / Authentic ID Verification • Multi-Vendor B2B Industrial Marketplace</p>
        </div>
      </div>
    </footer>
  );
}

