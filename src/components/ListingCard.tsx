import Link from "next/link";
import { BadgeCheck, MapPin, MessageCircle, Plus } from "lucide-react";
import type { ListingRecord } from "@/lib/types";

export function ListingCard({ listing }: { listing: ListingRecord }) {
  const cleanWa = (listing.vendor_whatsapp || listing.vendor_mobile || "917382177653").replace(/\D/g, "");
  const waHref = `https://wa.me/${cleanWa.length === 10 ? `91${cleanWa}` : cleanWa}?text=${encodeURIComponent(
    `Hello, I am interested in "${listing.title}" listed on RAWMET MART.`
  )}`;

  return (
    <article className="group rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
      <Link href={`/listings/${listing.slug}`} className="relative h-36 sm:h-48 bg-slate-100 overflow-hidden block">
        <img
          src={listing.image_url || "/images/cat-products.png"}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1">
          {listing.featured === 1 && (
            <span className="rounded-md bg-[#f97316] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
              Featured
            </span>
          )}
        </div>
        <span className="hidden sm:inline-block absolute bottom-2.5 right-2.5 rounded-lg bg-white/95 backdrop-blur px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 shadow-xs">
          {listing.availability}
        </span>
      </Link>

      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <span className="rounded-md bg-blue-50 text-[#0a2458] px-1.5 py-0.5 text-[9.5px] sm:text-[10.5px] font-extrabold uppercase tracking-wide truncate max-w-[65%]">
              {listing.category_slug.replace(/-/g, " ")}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[9.5px] sm:text-[11px] font-medium text-slate-500 truncate">
              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#f97316] shrink-0" />
              {listing.location.split(",")[0]}
            </span>
          </div>

          <Link href={`/listings/${listing.slug}`}>
            <h3 className="text-xs sm:text-sm font-extrabold text-[#0a2458] group-hover:text-[#1652b8] transition-colors line-clamp-2 leading-snug min-h-[2.1rem] sm:min-h-[2.5rem]">
              {listing.title}
            </h3>
          </Link>

          <p className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-[#1652b8] mt-1 truncate">
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            {listing.vendor_name || "Verified RAWMET Vendor"}
          </p>

          <Link
            href={`/listings/${listing.slug}`}
            className="inline-block mt-1.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#1652b8] hover:text-[#f97316]"
          >
            VIEW DETAILS
          </Link>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
          <span className="text-[11px] sm:text-sm font-extrabold text-[#0a2458] truncate">
            {listing.price_display}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              title="WhatsApp Vendor"
              aria-label="WhatsApp Vendor"
              className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-1.5 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
            <Link
              href={`/listings/${listing.slug}#enquiry`}
              className="inline-flex items-center gap-0.5 rounded-lg bg-[#0a2458] hover:bg-[#f97316] text-white px-2 sm:px-3 py-1.5 text-[10.5px] sm:text-xs font-extrabold transition-colors"
            >
              <span>Enquire</span>
              <Plus className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
