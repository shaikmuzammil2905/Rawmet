import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-sm font-extrabold uppercase tracking-wider text-[#f97316]">404 — Page Not Found</p>
      <h1 className="mt-2 text-3xl font-extrabold text-[#0a2458]">We couldn&apos;t find that industrial page</h1>
      <p className="mt-2 text-sm text-slate-600">
        Explore our verified Products, Machineries, Services, or search the RAWMET.com portal directly.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-[#0a2458] text-white px-6 py-2.5 text-sm font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-full bg-[#f97316] text-white px-6 py-2.5 text-sm font-bold"
        >
          <Search className="h-4 w-4" />
          Search Portal
        </Link>
      </div>
    </div>
  );
}

