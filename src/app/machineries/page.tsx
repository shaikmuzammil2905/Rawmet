import type { Metadata } from "next";
import { getCategories, getSubcategories, queryListings } from "@/lib/data";
import { CatalogBrowser } from "@/components/CatalogBrowser";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Industrial Machineries & Turnkey Plants",
  description: "Explore Rubber Machineries, Plastic Extrusion & Injection lines, Metals Plants, Bio Petro Chemical Plants, and Vehicle Body Fabrication.",
};

export default function MachineriesPage() {
  const categories = getCategories("machinery");
  const subcategories = getSubcategories();
  const { items, total } = queryListings({ type: "machinery", limit: 12 });

  return (
    <CatalogBrowser
      type="machinery"
      title="Industrial Machineries & Turnkey Plants"
      subtitle="Rubber, Plastic, Metals – Plants, Bio Petro Chemical Plants, and Commercial Vehicle Fabrication & Bodybuilders."
      categories={categories}
      subcategories={subcategories}
      initialItems={items}
      initialTotal={total}
      basePath="/machineries"
    />
  );
}

