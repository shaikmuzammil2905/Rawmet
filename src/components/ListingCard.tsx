import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, MessageCircle } from "lucide-react";
import type { ListingRecord } from "@/lib/types";

export function ListingCard({ listing }: { listing: ListingRecord }) {
  const cleanWa = (listing.vendor_whatsapp || listing.vendor_mobile || "917382177653").replace(/\D/g, "");
  const waHref = `https://wa.me/${cleanWa.length === 10 ? `91${cleanWa}` : cleanWa}?text=${encodeURIComponent(
    `Hello, I am interested in "${listing.title}" listed on RAWMET.com.`
  )}`;

  return (
    <article className="group rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      <Link href={`/listings/${listing.slug}`} className="relative h-48 bg-slate-100 overflow-hidden block">
        <img
          src={listing.image_url || "/images/cat-products.png"}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-[#0a2458]/90 backdrop-blur px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
            {listing.category_slug.replace(/-/g, " ")}
          </span>
          {listing.featured === 1 && (
            <span className="rounded-full bg-[#f97316] px-2.5 py-0.5 text-[11px] font-semibold text-white">
              Featured
            </span>
          )}
        </div>
        <span className="absolute bottom-3 right-3 rounded-lg bg-white/95 backdrop-blur px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-sm">
          {listing.availability}
        </span>
      </Link>

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
          <span className="inline-flex items-center gap-1 font-semibold text-[#1652b8] truncate">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            {listing.vendor_name || "Verified RAWMET Vendor"}
          </span>
          <span className="text-[11px] font-medium capitalize text-slate-400 shrink-0">{listing.type}</span>
        </div>

        <Link href={`/listings/${listing.slug}`}>
          <h3 className="text-base font-bold text-[#0a2458] group-hover:text-[#1652b8] transition-colors line-clamp-2 leading-snug">
            {listing.title}
          </h3>
        </Link>

        <p className="mt-2 text-sm text-slate-600 line-clamp-2 flex-1">{listing.short_description}</p>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-slate-500 truncate">
            <MapPin className="h-3.5 w-3.5 text-[#f97316] shrink-0" />
            {listing.location}
          </span>
          <span className="font-bold text-[#0a2458] shrink-0">{listing.price_display}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/listings/${listing.slug}#enquiry`}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0a2458] hover:bg-[#06183d] text-white px-3 py-2 text-xs font-semibold transition-colors"
          >
            <span>Enquire Now</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <a
            href={waHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-2 text-xs font-semibold transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </article>
  );
}

