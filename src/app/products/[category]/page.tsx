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
  const cat = getCategories("product").find((c) => c.slug === category);
  return {
    title: cat ? `${cat.name} Industrial Products` : "Products",
    description: cat?.description || "Industrial raw materials marketplace on RAWMET.com",
  };
}

export default async function ProductCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categories = getCategories("product");
  const active = categories.find((c) => c.slug === category);
  if (!active) notFound();

  const subcategories = getSubcategories();
  const { items, total } = queryListings({ type: "product", category, limit: 12 });

  return (
    <CatalogBrowser
      type="product"
      title={`${active.name} Products`}
      subtitle={active.description}
      categories={categories}
      subcategories={subcategories}
      initialCategory={category}
      initialItems={items}
      initialTotal={total}
      basePath="/products"
    />
  );
}

