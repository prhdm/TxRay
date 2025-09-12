import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Configure for SPA mode
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
