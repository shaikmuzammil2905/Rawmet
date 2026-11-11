import type { Metadata } from "next";
import { getCategories, getSubcategories, queryListings } from "@/lib/data";
import { CatalogBrowser } from "@/components/CatalogBrowser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Industrial Products Marketplace",
  description: "Browse GST-verified Rubber, Plastic, Metals, and Bio Petro Chemical raw material suppliers on RAWMET.com.",
};

export default function ProductsPage() {
  const categories = getCategories("product");
  const subcategories = getSubcategories();
  const { items, total } = queryListings({ type: "product", limit: 12 });

  return (
    <CatalogBrowser
      type="product"
      title="Industrial Products Marketplace"
      subtitle="Source bulk Rubber, Plastic Polymers & Granules, Stainless Steel & Alloys, and Bio Petro Chemicals directly from GST-verified Indian suppliers."
      categories={categories}
      subcategories={subcategories}
      initialItems={items}
      initialTotal={total}
      basePath="/products"
    />
  );
}

