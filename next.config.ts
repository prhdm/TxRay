import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Configure for SPA mode
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Turbopack configuration
  turbopack: {
    root: './',
  },
  
  // Webpack config for production builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Exclude supabase folder from webpack processing
    const existingIgnored = config.watchOptions?.ignored 
      ? (Array.isArray(config.watchOptions.ignored) ? config.watchOptions.ignored : [])
      : [];
    
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...existingIgnored,
        '**/supabase/**',
        '**/supabase/**/*'
      ]
    };
    
    return config;
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  }
};

export default nextConfig;
