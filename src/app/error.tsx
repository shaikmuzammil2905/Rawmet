"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <AlertTriangle className="h-10 w-10 text-[#f97316] mx-auto mb-3" />
      <h2 className="text-2xl font-extrabold text-[#0a2458]">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-600">{error.message || "Unexpected application error."}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-full bg-[#0a2458] text-white px-5 py-2.5 text-sm font-bold"
        >
          <RotateCcw className="h-4 w-4" />
          Retry
        </button>
        <Link href="/" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700">
          Return Home
        </Link>
      </div>
    </div>
  );
}

