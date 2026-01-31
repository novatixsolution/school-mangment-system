/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Disable image optimization to speed up build
  images: {
    unoptimized: true,
  },

  // Enable SWC minification (faster)
  swcMinify: true,

  // Reduce build strictness temporarily
  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  // Optimize build performance
  experimental: {
    optimizeCss: false, // Disable CSS optimization temporarily
  },
};

export default nextConfig;