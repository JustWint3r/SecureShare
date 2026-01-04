import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Ignore electron and other native modules that IPFS tries to load
    config.resolve.fallback = {
      ...config.resolve.fallback,
      electron: false,
      fs: false,
      net: false,
      tls: false,
    };

    // Ignore warnings from node_modules
    config.ignoreWarnings = [
      { module: /node_modules\/electron-fetch/ },
      { module: /node_modules\/ipfs-utils/ },
    ];

    return config;
  },

  // Turbopack configuration
  experimental: {
    turbo: {
      resolveAlias: {
        electron: './src/lib/empty-module.ts',
      },
    },
  },
};

export default nextConfig;
