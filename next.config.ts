/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Disable image optimization to speed up build and prevent hangs
  images: {
    unoptimized: true,
  },

  // Skip linting and type checking during builds to identify if they are the bottleneck
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;