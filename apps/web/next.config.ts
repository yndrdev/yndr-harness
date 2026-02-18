import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@yndr/engine", "@yndr/db"],
};

export default nextConfig;
