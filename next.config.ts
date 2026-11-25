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
        source: "/industry",
        destination: "/machineries",
      },
      {
        source: "/industry/:category",
        destination: "/machineries/:category",
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
