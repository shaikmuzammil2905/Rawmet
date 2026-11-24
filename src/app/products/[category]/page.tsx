import type { Metadata } from "next";
import { getCategories, getSubcategories, queryListings, slugify } from "@/lib/data";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { syncDbFromS3 } from "@/lib/db";
import type { CategoryRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  await syncDbFromS3();
  const rawCat = (await params).category || "";
  const normalized = decodeURIComponent(rawCat).toLowerCase().trim();
  const categories = getCategories("product");
  const cat =
    categories.find((c) => c.slug.toLowerCase() === normalized) ||
    categories.find((c) => slugify(c.name).toLowerCase() === normalized) ||
    categories.find((c) => c.slug.toLowerCase().startsWith(normalized)) ||
    categories.find((c) => normalized.startsWith(c.slug.toLowerCase())) ||
    categories.find((c) => rawCat === "bio-petro-chemical" && c.slug === "bio");

  const title = cat ? `${cat.name} Industrial Products` : `${decodeURIComponent(rawCat).replace(/[-_]/g, " ")} Products`;
  return {
    title,
    description: cat?.description || "Industrial raw materials marketplace on RAWMAT MART",
  };
}

export default async function ProductCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  await syncDbFromS3();
  const rawCat = (await params).category || "";
  const normalized = decodeURIComponent(rawCat).toLowerCase().trim();
  const categories = getCategories("product");
  const active =
    categories.find((c) => c.slug.toLowerCase() === normalized) ||
    categories.find((c) => slugify(c.name).toLowerCase() === normalized) ||
    categories.find((c) => c.slug.toLowerCase().startsWith(normalized)) ||
    categories.find((c) => normalized.startsWith(c.slug.toLowerCase())) ||
    categories.find((c) => rawCat === "bio-petro-chemical" && c.slug === "bio");

  const activeCat: CategoryRecord = active || {
    id: 9999,
    type: "product",
    name: decodeURIComponent(rawCat).replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    slug: rawCat,
    description: "Verified industrial raw materials and products on RAWMAT MART.",
    image_url: "/images/cat-products.png",
    sort_order: 99,
    is_active: 1,
  };

  const subcategories = getSubcategories();
  const { items, total } = queryListings({ type: "product", category: activeCat.slug, limit: 12 });

  return (
    <CatalogBrowser
      type="product"
      title={`${activeCat.name} Products`}
      subtitle={activeCat.description}
      categories={categories.some((c) => c.slug === activeCat.slug) ? categories : [...categories, activeCat]}
      subcategories={subcategories}
      initialCategory={activeCat.slug}
      initialItems={items}
      initialTotal={total}
      basePath="/products"
    />
  );
}

