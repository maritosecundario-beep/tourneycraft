import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Requerido para Capacitor
  images: {
    unoptimized: true, // Requerido para exportación estática
  },
  // Desactivar linting y typechecking en build para acelerar el proceso de APK
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
