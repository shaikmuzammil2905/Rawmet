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
  const cat = getCategories("service").find((c) => c.slug === category);
  return {
    title: cat ? cat.name : "Services",
    description: cat?.description || "Industrial services on RAWMET.com",
  };
}

export default async function ServiceCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categories = getCategories("service");
  const active = categories.find((c) => c.slug === category);
  if (!active) notFound();

  const subcategories = getSubcategories();
  const { items, total } = queryListings({ type: "service", category, limit: 12 });

  return (
    <CatalogBrowser
      type="service"
      title={active.name}
      subtitle={active.description}
      categories={categories}
      subcategories={subcategories}
      initialCategory={category}
      initialItems={items}
      initialTotal={total}
      basePath="/services"
    />
  );
}

