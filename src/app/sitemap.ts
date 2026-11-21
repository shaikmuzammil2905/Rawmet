import type { MetadataRoute } from "next";
import { getCategories, queryListings } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://rawmet.com";
  const staticPaths = [
    "",
    "/about",
    "/products",
    "/machineries",
    "/services",
    "/gallery",
    "/requirements",
    "/subscriptions",
    "/promote",
    "/search",
    "/vendor/register",
    "/login",
  ];

  let catPaths: string[] = [];
  let listingPaths: string[] = [];

  try {
    const categories = getCategories();
    catPaths = categories.map((c) => {
      const prefix = c.type === "product" ? "/products" : c.type === "machinery" ? "/machineries" : "/services";
      return `${prefix}/${c.slug}`;
    });

    const { items } = queryListings({ limit: 100 });
    listingPaths = items.map((l) => `/listings/${l.slug}`);
  } catch {
    // Graceful fallback during static build prerendering if DB is locked
  }

  return [...staticPaths, ...catPaths, ...listingPaths].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: p === "" ? 1.0 : 0.8,
  }));
}

