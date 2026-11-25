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
    ];
  },
};

export default nextConfig;
