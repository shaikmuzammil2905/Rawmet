import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import { getListingBySlug } from "@/lib/data";
import { ListingDetailClient } from "@/components/ListingDetailClient";
import { ListingCard } from "@/components/ListingCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { listing } = getListingBySlug(slug);
  if (!listing) return { title: "Listing Not Found" };
  return {
    title: listing.title,
    description: listing.short_description,
    openGraph: {
      title: listing.title,
      description: listing.short_description,
      images: [{ url: listing.image_url }],
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { listing, vendor, related } = getListingBySlug(slug);
  if (!listing || !vendor) notFound();

  let specs: Record<string, string> = {};
  try {
    specs = JSON.parse(listing.specifications || "{}");
  } catch {
    specs = {};
  }

  let galleryUrls: string[] = [];
  try {
    galleryUrls = JSON.parse(listing.gallery_urls || "[]");
  } catch {
    galleryUrls = [];
  }
  if (galleryUrls.length === 0) galleryUrls = [listing.image_url];

  const cleanWa = (vendor.whatsapp || vendor.mobile || "917382177653").replace(/\D/g, "");
  const whatsappHref = `https://wa.me/${cleanWa.length === 10 ? `91${cleanWa}` : cleanWa}?text=${encodeURIComponent(
    `Hello ${vendor.business_name}, I found "${listing.title}" on RAWMET.com and would like a quotation.`
  )}`;

  const parentPath =
    listing.type === "product"
      ? "/products"
      : listing.type === "machinery"
        ? "/machineries"
        : "/services";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": listing.type === "service" ? "Service" : "Product",
    name: listing.title,
    description: listing.description || listing.short_description,
    brand: { "@type": "Organization", name: vendor.business_name },
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Breadcrumbs */}
      <nav className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 mb-6">
        <Link href="/" className="hover:text-[#0a2458]">Home</Link>
        <span>/</span>
        <Link href={parentPath} className="capitalize hover:text-[#0a2458]">{listing.type}</Link>
        <span>/</span>
        <Link href={`${parentPath}/${listing.category_slug}`} className="capitalize hover:text-[#0a2458]">
          {listing.category_slug.replace(/-/g, " ")}
        </Link>
        <span>/</span>
        <span className="text-[#0a2458] font-semibold truncate max-w-xs">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Gallery + Enquiry */}
        <div className="lg:col-span-6">
          <ListingDetailClient
            listingId={listing.id}
            vendorId={vendor.id}
            listingTitle={listing.title}
            whatsappHref={whatsappHref}
            galleryUrls={galleryUrls}
          />
        </div>

        {/* Right: Specifications & Verified Vendor Info */}
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="rounded-full bg-[#0a2458] text-white px-3 py-1 text-xs font-bold uppercase tracking-wide">
                {listing.category_slug.replace(/-/g, " ")}
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-bold">
                {listing.availability}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a2458] leading-tight">
              {listing.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <div className="font-extrabold text-xl text-[#f97316]">{listing.price_display}</div>
              <span className="inline-flex items-center gap-1 text-slate-600">
                <MapPin className="h-4 w-4 text-[#1652b8]" />
                {listing.location}
              </span>
            </div>

            <p className="mt-4 text-sm sm:text-base text-slate-700 leading-relaxed">
              {listing.description || listing.short_description}
            </p>

            {/* Technical Specifications */}
            {Object.keys(specs).length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0a2458] mb-3">
                  Technical Specifications
                </h2>
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(specs).map(([k, v]) => (
                        <tr key={k} className="bg-white even:bg-slate-50/70">
                          <th className="text-left font-semibold text-slate-600 px-4 py-2.5 w-2/5">{k}</th>
                          <td className="font-medium text-[#0a2458] px-4 py-2.5">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Verified Vendor Card */}
          <div className="rounded-3xl bg-gradient-to-br from-[#0a2458] to-[#0f3478] text-white p-6 shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300">
                  <BadgeCheck className="h-4 w-4" />
                  GST / ID Verified Vendor
                </span>
                <h2 className="mt-2.5 text-xl font-extrabold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-orange-400" />
                  {vendor.business_name}
                </h2>
                <p className="text-xs text-blue-200 mt-0.5">
                  {vendor.business_category} • {vendor.city}, {vendor.state}
                </p>
              </div>
              <ShieldCheck className="h-8 w-8 text-orange-400 shrink-0" />
            </div>

            <p className="mt-3 text-sm text-blue-100 leading-relaxed">{vendor.description}</p>

            <div className="mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-blue-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                GSTIN: <strong className="text-white">{vendor.gst_number}</strong>
              </span>
              <Link
                href="/requirements#post"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#f97316] hover:bg-[#ea580c] px-4 py-2 font-bold text-white transition-colors"
              >
                <span>Post Bulk Requirement</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Related Listings */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-extrabold text-[#0a2458] mb-5">Related Verified Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((r) => (
              <ListingCard key={r.id} listing={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

