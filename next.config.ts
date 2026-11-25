import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["node-sqlite3-wasm"],
  outputFileTracingIncludes: {
    "/**": ["./node_modules/node-sqlite3-wasm/dist/**/*"],
  },
  async rewrites() {
    return [
      {
        source: "/product",
        destination: "/products",
      },
      {
        source: "/product/:category*",
        destination: "/products/:category*",
      },
      {
        source: "/machinery",
        destination: "/machineries",
      },
      {
        source: "/machinery/:category*",
        destination: "/machineries/:category*",
      },
      {
        source: "/industry",
        destination: "/machineries",
      },
      {
        source: "/industry/:category*",
        destination: "/machineries/:category*",
      },
      {
        source: "/service",
        destination: "/services",
      },
      {
        source: "/service/:category*",
        destination: "/services/:category*",
      },
      {
        source: "/category/:category*",
        destination: "/products/:category*",
      },
      {
        source: "/categories/:category*",
        destination: "/products/:category*",
      },
      {
        source: "/categories",
        destination: "/products",
      },
      {
        source: "/item/:slug",
        destination: "/listings/:slug",
      },
      {
        source: "/listing/:slug",
        destination: "/listings/:slug",
      },
      {
        source: "/seller/dashboard",
        destination: "/vendor/dashboard",
      },
      {
        source: "/seller/register",
        destination: "/vendor/register",
      },
      {
        source: "/seller",
        destination: "/seller/login",
      },
    ];
  },
};

export default nextConfig;
