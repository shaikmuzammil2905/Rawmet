import type { Metadata } from "next";
import { GlobalSearchClient } from "@/components/GlobalSearchClient";

export const metadata: Metadata = {
  title: "Search Marketplace",
  description: "Search across industrial products, machineries, services, vendors, and live requirements on RAWMET.com.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  return <GlobalSearchClient initialQuery={q} />;
}

