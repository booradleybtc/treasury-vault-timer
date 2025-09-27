import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: '/Users/bradleysullivan/treasury-vault-timer/frontend',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Enable experimental features if needed
  },
};

export default nextConfig;