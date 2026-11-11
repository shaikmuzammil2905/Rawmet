import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["node-sqlite3-wasm"],
  outputFileTracingIncludes: {
    "/**": ["./node_modules/node-sqlite3-wasm/dist/**/*"],
  },
};

export default nextConfig;
