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

  const categories = getCategories();
  const catPaths = categories.map((c) => {
    const prefix = c.type === "product" ? "/products" : c.type === "machinery" ? "/machineries" : "/services";
    return `${prefix}/${c.slug}`;
  });

  const { items } = queryListings({ limit: 100 });
  const listingPaths = items.map((l) => `/listings/${l.slug}`);

  return [...staticPaths, ...catPaths, ...listingPaths].map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: p === "" ? 1.0 : 0.8,
  }));
}

