import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getSubcategories, queryListings } from "@/lib/data";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { syncDbFromS3 } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  await syncDbFromS3();
  const { category } = await params;
  const categories = getCategories("machinery");
  const cat =
    categories.find((c) => c.slug === category) ||
    categories.find((c) => category === "bpc-plants" && c.slug === "bio-plant") ||
    categories.find((c) => category === "vehicle-fabrication" && c.slug === "coconut-process-machinery");
  return {
    title: cat ? `${cat.name}` : "Machineries",
    description: cat?.description || "Industrial machineries on RAWMAT MART",
  };
}

export default async function MachineryCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  await syncDbFromS3();
  const { category } = await params;
  const categories = getCategories("machinery");
  const active =
    categories.find((c) => c.slug === category) ||
    categories.find((c) => category === "bpc-plants" && c.slug === "bio-plant") ||
    categories.find((c) => category === "vehicle-fabrication" && c.slug === "coconut-process-machinery");
  if (!active) notFound();

  const subcategories = getSubcategories();
  const { items, total } = queryListings({ type: "machinery", category: active.slug, limit: 12 });

  return (
    <CatalogBrowser
      type="machinery"
      title={active.name}
      subtitle={active.description}
      categories={categories}
      subcategories={subcategories}
      initialCategory={active.slug}
      initialItems={items}
      initialTotal={total}
      basePath="/machineries"
    />
  );
}

