import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getSubcategories, queryListings } from "@/lib/data";
import { CatalogBrowser } from "@/components/CatalogBrowser";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategories("machinery").find((c) => c.slug === category);
  return {
    title: cat ? `${cat.name}` : "Machineries",
    description: cat?.description || "Industrial machineries on RAWMET.com",
  };
}

export default async function MachineryCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categories = getCategories("machinery");
  const active = categories.find((c) => c.slug === category);
  if (!active) notFound();

  const subcategories = getSubcategories();
  const { items, total } = queryListings({ type: "machinery", category, limit: 12 });

  return (
    <CatalogBrowser
      type="machinery"
      title={active.name}
      subtitle={active.description}
      categories={categories}
      subcategories={subcategories}
      initialCategory={category}
      initialItems={items}
      initialTotal={total}
      basePath="/machineries"
    />
  );
}

