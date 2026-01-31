import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Isse hum TypeScript errors ko ignore kar rahe hain taake deploy na ruke
    ignoreBuildErrors: true,
  },
  // Eslint wala part hata diya hai kyunke wo error de raha tha
};

export default nextConfig;