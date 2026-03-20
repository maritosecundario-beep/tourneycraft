import type { NextConfig } from "next";
import { withPlausibleProxy } from 'next-plausible';

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // La exportación estática ('export') rompe las funciones de servidor de Vercel (Genkit).
  // Solo la activamos cuando compilamos específicamente para Capacitor/Móvil o GitHub Pages.
  output: (process.env.IS_CAPACITOR === 'true' || process.env.GITHUB_PAGES === 'true') ? 'export' : undefined,
  basePath: process.env.GITHUB_PAGES === 'true' ? '/tourneycraft' : '',
  assetPrefix: process.env.GITHUB_PAGES === 'true' ? '/tourneycraft/' : '',
  images: {
    unoptimized: true, // Requerido para exportación estática y compatible con Vercel/GitHub Pages
  },
  webpack: (config) => {
    config.externals.push('sharp');
    return config;
  },
  // Desactivar linting y typechecking en build para acelerar el proceso
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withPlausibleProxy()(nextConfig);