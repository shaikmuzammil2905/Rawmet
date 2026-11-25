import type { Metadata } from "next";
import { getCategories, getSubcategories, queryListings } from "@/lib/data";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { syncDbFromS3 } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Industry & Turnkey Plants",
  description: "Explore Industry, Rubber Machinery, Plastic Extrusion & Injection lines, Metals Plants, Bio Petro Chemical Plants, and Vehicle Body Fabrication.",
};

export default async function MachineriesPage() {
  await syncDbFromS3(true);
  const categories = getCategories("machinery");
  const subcategories = getSubcategories();
  const { items, total } = queryListings({ type: "machinery", limit: 12 });

  return (
    <CatalogBrowser
      type="machinery"
      title="Industry & Turnkey Plants"
      subtitle="Rubber, Plastic, Metals – Plants, Bio Petro Chemical Plants, and Commercial Vehicle Fabrication & Bodybuilders."
      categories={categories}
      subcategories={subcategories}
      initialItems={items}
      initialTotal={total}
      basePath="/machineries"
    />
  );
}

