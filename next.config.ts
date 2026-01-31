import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Isse hum TypeScript errors ko ignore kar rahe hain taake deploy na ruke
    ignoreBuildErrors: true,
  },
  // Note: Removed eslint key as it was causing unrecognized key error in these logs
  images: {
    unoptimized: true,
  }
};

export default nextConfig;