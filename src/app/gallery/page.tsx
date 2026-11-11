import type { Metadata } from "next";
import { getGalleryItems } from "@/lib/data";
import { GalleryClient } from "@/components/GalleryClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Industrial Gallery",
  description: "Explore industrial plants, raw materials, machineries, and service projects showcased on RAWMET.com.",
};

export default function GalleryPage() {
  const items = getGalleryItems();

  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8">
      <div className="rounded-3xl bg-gradient-to-r from-[#0a2458] to-[#123983] p-6 sm:p-8 text-white shadow-lg mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-300">RAWMET.com Visual Showcase</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold">Industrial &amp; Plant Gallery</h1>
        <p className="mt-1 text-sm text-blue-100">
          Admin-curated showcase of verified partner factories, raw materials, turnkey machinery lines, and engineering services.
        </p>
      </div>

      <GalleryClient items={items} />
    </div>
  );
}

