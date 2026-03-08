
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/tourneycraft',
  assetPrefix: '/tourneycraft',
  images: {
    unoptimized: true,
  },
  // Optional: Add other Next.js configuration here
};

export default nextConfig;
