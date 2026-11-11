import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { getCmsMap } from "@/lib/data";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About RAWMET / Sriñidhi Enterprises",
  description:
    "Learn about RAWMET.com operated by Sriñidhi Enterprises — India's multi-vendor B2B industrial marketplace and real-time business portal.",
};

export default function AboutPage() {
  const { aboutContent, contactSettings, businessSupport } = getCmsMap();

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10 space-y-12">
      {/* Header Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-[#0a2458] via-[#103274] to-[#06183d] p-7 sm:p-12 text-white shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <span className="inline-block rounded-full bg-orange-500/20 border border-orange-400/40 px-3 py-1 text-xs font-bold text-orange-300 uppercase tracking-wider">
            RAWMET.com • Sriñidhi Enterprises
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
            {aboutContent.headline}
          </h1>
          <p className="text-base sm:text-lg text-blue-100 font-medium">{aboutContent.subheadline}</p>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">{aboutContent.fullStory}</p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/vendor/register"
              className="inline-flex items-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] px-6 py-3 text-sm font-bold text-white shadow"
            >
              <span>Register as Verified Vendor</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/requirements"
              className="inline-flex items-center gap-2 rounded-full bg-white text-[#0a2458] hover:bg-blue-50 px-6 py-3 text-sm font-bold shadow"
            >
              <span>Explore Live Requirements</span>
            </Link>
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl aspect-[16/10]">
            <img
              src={aboutContent.imageUrl || "/images/refinery-plant.png"}
              alt="RAWMET Industrial Ecosystem"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {aboutContent.stats.map((s) => (
          <div key={s.key} className="rounded-2xl bg-white border border-slate-200 p-6 text-center shadow-sm">
            <div className="text-3xl font-extrabold text-[#0a2458]">
              <AnimatedCounter target={s.target} suffix={s.suffix} />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-600">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Mission & Vision */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Reveal className="rounded-3xl bg-white border border-slate-200 p-7 shadow-sm">
          <span className="inline-block h-1 w-10 rounded-full bg-[#f97316] mb-3" />
          <h2 className="text-xl font-extrabold text-[#0a2458]">Our Mission</h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">{aboutContent.mission}</p>
        </Reveal>
        <Reveal className="rounded-3xl bg-white border border-slate-200 p-7 shadow-sm" delayMs={100}>
          <span className="inline-block h-1 w-10 rounded-full bg-[#1652b8] mb-3" />
          <h2 className="text-xl font-extrabold text-[#0a2458]">Our Vision</h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">{aboutContent.vision}</p>
        </Reveal>
      </section>

      {/* Paid Customer Business Support */}
      <section className="rounded-3xl bg-white border border-slate-200 p-7 sm:p-10 shadow-sm">
        <h2 className="text-2xl font-extrabold text-[#0a2458]">Paid Subscriber Business Support Services</h2>
        <p className="text-sm text-slate-600 mt-1">
          Offered as business support initiatives for eligible paid subscribers.{" "}
          <strong>{contactSettings.conditionsApplyNote}</strong>
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {businessSupport.map((b) => (
            <div key={b.id} className="rounded-2xl bg-[#f8faff] border border-blue-100 p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#f97316]">
                <CheckCircle2 className="h-4 w-4" />
                {b.badge}
              </div>
              <h3 className="mt-2 text-lg font-extrabold text-[#0a2458]">{b.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{b.description}</p>
              <p className="mt-3 text-xs font-bold text-slate-500">{b.conditions}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Us */}
      <section id="contact" className="rounded-3xl bg-[#0a2458] text-white p-7 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-3">
          <h2 className="text-2xl font-extrabold">Contact {contactSettings.companyName}</h2>
          <p className="text-sm text-blue-100">
            Reach our customer care desk for vendor verification, subscription assistance, GST/IT support conditions, or promotional partnerships.
          </p>
          <div className="space-y-2 pt-2 text-sm">
            <p className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-orange-400" />
              <span>Mobile / Customer Care: <strong>{contactSettings.mobile}</strong></span>
            </p>
            <p className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-orange-400" />
              <span>Email: <strong>{contactSettings.email}</strong></span>
            </p>
            <p className="flex items-center gap-2.5">
              <MapPin className="h-4 w-4 text-orange-400" />
              <span>{contactSettings.address}</span>
            </p>
            {contactSettings.gstNumber && (
              <p className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Registered GSTIN: <strong>{contactSettings.gstNumber}</strong></span>
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap md:justify-end gap-3">
          <a
            href={`https://wa.me/${contactSettings.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-bold text-white"
          >
            Chat on WhatsApp
          </a>
          <Link
            href="/promote"
            className="rounded-full bg-[#f97316] hover:bg-[#ea580c] px-6 py-3 text-sm font-bold text-white"
          >
            Promote Us • Grow With Us
          </Link>
        </div>
      </section>
    </div>
  );
}

