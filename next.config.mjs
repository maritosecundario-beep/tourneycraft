
import { withPlausibleProxy } from 'next-plausible';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: process.env.IS_CAPACITOR === 'true' ? 'export' : undefined,
  // Your existing configuration
  experimental: {
    // Your existing experimental features
  },
  webpack: (config) => {
    config.externals.push('sharp');
    return config;
  },
  images: {
    unoptimized: true,
  },
  // Ensure you have a valid caching strategy if needed
  // and other configurations are correct.
};

export default withPlausibleProxy()(nextConfig);
