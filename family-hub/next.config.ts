import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cognite/aura"],
  outputFileTracingIncludes: {
    "/api/dinner/plan": ["./content/dinner.md"],
  },
};

export default nextConfig;
