import type { Metadata } from "next";
import { getCategories, getSubcategories, queryListings } from "@/lib/data";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { syncDbFromS3 } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Industrial & Business Services",
  description:
    "Manpower Services, AMC, Maintenance, Mechanical, Logistics, Loans, Business Registrations, and Website / App Services on RAWMAT MART.",
};

export default async function ServicesPage() {
  await syncDbFromS3(true);
  const categories = getCategories("service");
  const subcategories = getSubcategories();
  const { items, total } = queryListings({ type: "service", limit: 12 });

  return (
    <CatalogBrowser
      type="service"
      title="Industrial & Business Services"
      subtitle="Manpower Services, Plant AMC, Maintenance, Mechanical Fabrication, Industrial Logistics, MSME Loans, Business Registrations, and Website / App Services."
      categories={categories}
      subcategories={subcategories}
      initialItems={items}
      initialTotal={total}
      basePath="/services"
    />
  );
}

