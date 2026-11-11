import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Cog,
  FileText,
  Globe,
  Handshake,
  Layers,
  MapPin,
  Package,
  Phone,
  Scale,
  ShieldCheck,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import {
  getCategories,
  getCmsMap,
  getRequirements,
  getSubscriptionPlans,
  queryListings,
} from "@/lib/data";
import { HeroSection } from "@/components/HeroSection";
import { Reveal } from "@/components/Reveal";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { ListingCard } from "@/components/ListingCard";
import { BusinessSupportCards } from "@/components/BusinessSupportCards";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const cms = getCmsMap();
  const { items: featuredListings } = queryListings({ limit: 6, featured: true });
  const { items: recentListings } = queryListings({ limit: 8 });
  const displayListings = featuredListings.length >= 3 ? featuredListings : recentListings;
  const serviceCategories = getCategories("service");
  const plans = getSubscriptionPlans();
  const requirements = getRequirements({ limit: 4 });

  const mainPillars = [
    {
      title: "Products",
      subtitle: "Rubber, Plastic, Metals, Bio Petro Chemical",
      href: "/products",
      image: "/images/cat-products.png",
      icon: Package,
    },
    {
      title: "Machineries",
      subtitle: "Rubber, Plastic, Metals - Plants & More",
      href: "/machineries",
      image: "/images/cat-machineries.png",
      icon: Cog,
    },
    {
      title: "Services",
      subtitle: "Manpower, AMC, Maintenance & More",
      href: "/services",
      image: "/images/cat-services.png",
      icon: Wrench,
    },
  ];

  const statIcons: Record<string, typeof Users> = {
    users: Users,
    handshake: Handshake,
    shield: ShieldCheck,
    clock: Clock,
  };

  return (
    <div>
      {/* 1. Hero Section with Carousel + Search */}
      <HeroSection slides={cms.heroSlides} />

      {/* 2. Three Main Category Cards (overlapping hero cleanly on desktop) */}
      <section className="relative z-20 mx-auto max-w-[1400px] px-4 sm:px-6 -mt-6 md:-mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mainPillars.map((card, i) => {
            const Icon = card.icon;
            return (
              <Reveal key={card.title} delayMs={i * 70}>
                <Link
                  href={card.href}
                  className="card-orange-accent group flex items-center justify-between rounded-2xl border border-blue-100 p-3.5 sm:p-4 shadow-[0_8px_24px_rgba(10,36,88,0.08)] hover:shadow-[0_14px_32px_rgba(10,36,88,0.14)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-20 w-24 sm:h-22 sm:w-28 shrink-0 rounded-xl overflow-hidden bg-white border border-blue-100/80 shadow-sm">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-4 w-4 text-[#f97316] shrink-0" />
                        <h2 className="text-lg sm:text-xl font-extrabold text-[#0a2458] group-hover:text-[#1652b8] transition-colors">
                          {card.title}
                        </h2>
                      </div>
                      <p className="mt-0.5 text-xs sm:text-sm text-slate-600 leading-snug line-clamp-2">
                        {card.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0a2458] text-white group-hover:bg-[#f97316] transition-colors shadow">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* 3. About Sriñidhi Enterprises + Animated Counters + Launching Offer */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 sm:py-10">
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 sm:p-7 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* About Block */}
          <Reveal className="lg:col-span-4 space-y-3" variant="left">
            <span className="block h-1 w-10 rounded-full bg-[#f97316]" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0a2458]">
              {cms.aboutContent.headline}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">{cms.aboutContent.summary}</p>
            <div className="pt-1">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-full bg-[#0a2458] hover:bg-[#06183d] text-white px-5 py-2 text-xs sm:text-sm font-semibold shadow-sm transition-all"
              >
                <span>Know More</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          {/* Animated Viewport Statistics */}
          <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-2 border-y lg:border-y-0 lg:border-x border-slate-200 py-4 lg:py-0 lg:px-4">
            {cms.aboutContent.stats.map((stat, idx) => {
              const Icon = statIcons[stat.icon] || Users;
              return (
                <div
                  key={stat.key}
                  className={`flex flex-col items-center text-center px-2 py-1 ${
                    idx > 0 ? "xl:border-l xl:border-slate-200" : ""
                  }`}
                >
                  <Icon className="h-6 w-6 text-[#1652b8] mb-1.5" strokeWidth={2} />
                  <div className="text-xl sm:text-2xl font-extrabold text-[#0a2458] tracking-tight">
                    <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                  </div>
                  <div className="text-[11px] sm:text-xs font-medium text-slate-600 mt-0.5 leading-tight">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Launching Offer Card */}
          <Reveal className="lg:col-span-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0e347a] via-[#0a2458] to-[#06183d] p-5 text-white shadow-lg flex items-center justify-between gap-3">
              <div className="relative z-10 space-y-2 max-w-[65%]">
                <div className="inline-flex items-center gap-1.5 text-sm sm:text-base font-extrabold text-white">
                  <Tag className="h-4 w-4 text-orange-400" />
                  <span>{cms.launchingOffer.title}</span>
                </div>
                <p className="text-xs sm:text-sm text-blue-100 leading-snug">
                  {cms.launchingOffer.subtitle}
                </p>
                <p className="text-[11px] font-semibold text-orange-300">
                  3 Years + 4th Year FREE Offer!
                </p>
                <Link
                  href="/subscriptions"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-4 py-2 text-xs sm:text-sm font-bold shadow transition-all active:scale-[0.98]"
                >
                  <span>{cms.launchingOffer.ctaText}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="relative z-10 h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-xl overflow-hidden shadow-md">
                <img
                  src="/images/offer-gift.png"
                  alt="Launching Offer Gift"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 4. Dark Navy Value Strip + Diagonal Orange Promote Us Banner (matching reference bottom bar) */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pb-8">
        <div className="rounded-2xl bg-[#0a2458] text-white overflow-hidden shadow-md flex flex-col xl:flex-row items-stretch">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/15 py-3.5 px-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:px-3">
              <Globe className="h-6 w-6 text-blue-300 shrink-0" />
              <div className="text-xs leading-snug">
                <p className="font-bold">Free Listings for Verified Businesses</p>
                <p className="text-blue-200">(GST / Authentic ID Required)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:px-3">
              <Scale className="h-6 w-6 text-blue-300 shrink-0" />
              <div className="text-xs leading-snug">
                <p className="font-bold">Chartered Accountant Advice</p>
                <p className="text-blue-200">on Call (Conditions Apply)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:px-3">
              <FileText className="h-6 w-6 text-blue-300 shrink-0" />
              <div className="text-xs leading-snug">
                <p className="font-bold">GST &amp; IT Returns Filing</p>
                <p className="text-blue-200">(Conditions Apply)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:px-3">
              <Phone className="h-6 w-6 text-orange-400 shrink-0" />
              <div className="text-xs leading-snug">
                <p className="font-bold">Contact Us:</p>
                <a href={`tel:${cms.contactSettings.mobile.replace(/\s+/g, "")}`} className="text-orange-300 font-bold hover:underline">
                  {cms.contactSettings.mobile}
                </a>
              </div>
            </div>
          </div>

          <Link
            href="/promote"
            className="bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] px-6 py-4 flex items-center justify-center gap-2 font-extrabold text-sm sm:text-base text-white shrink-0 transition-all"
          >
            <span>Promote Us • Grow With Us</span>
            <TrendingUp className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* 5. Real-Time Business Opportunities Portal Section */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
        <Reveal>
          <div className="rounded-3xl bg-gradient-to-br from-[#0a2458] via-[#103274] to-[#081d48] p-6 sm:p-10 text-white shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/15">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/20 border border-orange-400/40 px-3 py-1 text-xs font-bold text-orange-300 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live B2B Trade Desk
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold">
                  Real-Time Business Opportunities
                </h2>
                <p className="mt-1.5 text-sm sm:text-base text-blue-100">
                  Find Requirements • Post Requirements • Connect with Businesses via Instant WhatsApp Alerts
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/requirements"
                  className="inline-flex items-center gap-2 rounded-full bg-white text-[#0a2458] hover:bg-blue-50 px-6 py-3 text-sm font-bold shadow transition-all"
                >
                  <span>Find Requirements</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/requirements#post"
                  className="inline-flex items-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-6 py-3 text-sm font-bold shadow transition-all"
                >
                  <span>Post Requirement</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {requirements.map((req) => (
                <Link
                  key={req.id}
                  href="/requirements"
                  className="rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 p-4 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide">
                      <span className="text-orange-300">{req.category_slug.replace(/-/g, " ")}</span>
                      <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5">
                        {req.matched_vendors_count} Matched
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-bold text-white line-clamp-2">{req.title}</h3>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-blue-200">
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      {req.location}
                    </span>
                    <span className="font-semibold text-white shrink-0">{req.quantity}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* 6. Featured Verified Industrial Listings */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#f97316]">
              Verified GST Marketplace
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a2458] mt-1">
              Featured Products, Machineries &amp; Plants
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/products" className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-[#0a2458] hover:border-[#0a2458]">
              All Products
            </Link>
            <Link href="/machineries" className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-[#0a2458] hover:border-[#0a2458]">
              All Machineries
            </Link>
            <Link href="/services" className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold text-[#0a2458] hover:border-[#0a2458]">
              All Services
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayListings.map((listing, idx) => (
            <Reveal key={listing.id} delayMs={(idx % 3) * 70}>
              <ListingCard listing={listing} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* 7. Industrial Services Grid */}
      <section className="bg-white border-y border-slate-200/80 py-12 my-4">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#f97316]">
                End-to-End Industrial Ecosystem
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0a2458] mt-1">
                Industrial &amp; Business Services
              </h2>
            </div>
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1652b8] hover:text-[#0a2458]"
            >
              <span>Explore All 8 Services</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {serviceCategories.map((svc, idx) => (
              <Reveal key={svc.id} delayMs={(idx % 4) * 55}>
                <Link
                  href={`/services/${svc.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={svc.image_url || "/images/cat-services.png"}
                        alt={svc.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a2458]/60 via-transparent to-transparent" />
                      <span className="absolute bottom-2.5 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[10.5px] font-extrabold text-[#0a2458] shadow-sm">
                        <Briefcase className="h-3 w-3 text-[#f97316]" />
                        Verified Service
                      </span>
                    </div>
                    <div className="p-4 sm:p-5">
                      <h3 className="text-base font-extrabold text-[#0a2458] group-hover:text-[#1652b8] transition-colors">
                        {svc.name}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {svc.description}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#f97316]">
                    <span>View &amp; Enquire</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Business Support Services (Paid Subscriber Benefits) */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 py-10">
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-[#f4f8ff] to-[#ebf2ff] p-6 sm:p-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0a2458] text-white px-3 py-1 text-xs font-bold">
                <Building2 className="h-3.5 w-3.5 text-orange-400" />
                Business Support Services for Paid Subscribers
              </span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-[#0a2458]">
                Advisory &amp; Statutory Filing Support
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Value-added business compliance assistance promoted through RAWMET.com.{" "}
                <strong className="text-[#0a2458]">Conditions Apply • Check with Customer Care ({cms.contactSettings.mobile}).</strong>
              </p>
            </div>
            <Link
              href="/subscriptions"
              className="inline-flex items-center gap-2 rounded-full bg-[#f97316] hover:bg-[#ea580c] text-white px-5 py-2.5 text-sm font-bold shadow shrink-0"
            >
              <span>View Paid Plans</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Reveal>
            <BusinessSupportCards
              items={cms.businessSupport}
              mobile={cms.contactSettings.mobile}
              whatsapp={cms.contactSettings.whatsapp}
            />
          </Reveal>
        </div>
      </section>

      {/* 9. Subscription Plans Highlight (incl. 4th Year FREE Offer) */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 pb-14 pt-4">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-[#f97316]">
            Transparent GST-Inclusive Pricing
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0a2458]">
            Business Portal Subscription Plans
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Unlock verified buyer/vendor direct contacts, WhatsApp opportunity alerts, and Launching Offer benefits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((plan, idx) => {
            const isLaunch = plan.bonus_months > 0;
            let features: string[] = [];
            try {
              features = JSON.parse(plan.features || "[]");
            } catch {
              features = [];
            }

            return (
              <Reveal key={plan.id} delayMs={idx * 65}>
                <div
                  className={`h-full rounded-2xl p-6 flex flex-col justify-between transition-all ${
                    isLaunch
                      ? "bg-gradient-to-b from-[#0a2458] to-[#06183d] text-white border-2 border-[#f97316] shadow-xl relative"
                      : "bg-white border border-slate-200 shadow-sm hover:shadow-lg"
                  }`}
                >
                <div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${
                      isLaunch
                        ? "bg-[#f97316] text-white"
                        : "bg-blue-50 text-[#1652b8]"
                    }`}
                  >
                    {plan.badge_text}
                  </span>
                  <h3 className={`mt-3 text-lg font-extrabold ${isLaunch ? "text-white" : "text-[#0a2458]"}`}>
                    {plan.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className={`text-3xl font-extrabold ${isLaunch ? "text-white" : "text-[#0a2458]"}`}>
                      ₹{plan.price_inr.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className={`text-xs mt-1 font-medium ${isLaunch ? "text-orange-300" : "text-slate-500"}`}>
                    Including 18% GST • {plan.duration_months + plan.bonus_months} Months Validity
                  </p>

                  <ul className="mt-4 space-y-2 text-xs">
                    {features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            isLaunch ? "text-orange-400" : "text-emerald-600"
                          }`}
                        />
                        <span className={isLaunch ? "text-blue-100" : "text-slate-600"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                  <Link
                    href={`/checkout?planId=${plan.id}`}
                    className={`mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full py-2.5 px-4 text-sm font-bold transition-all ${
                      isLaunch
                        ? "bg-[#f97316] hover:bg-[#ea580c] text-white shadow"
                        : "bg-[#0a2458] hover:bg-[#06183d] text-white"
                    }`}
                  >
                    <span>Subscribe Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>
    </div>
  );
}

