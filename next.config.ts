import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La exportación estática ('export') rompe las funciones de servidor de Vercel (Genkit).
  // Solo la activamos cuando compilamos específicamente para Capacitor/Móvil.
  output: process.env.IS_CAPACITOR === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true, // Requerido para exportación estática y compatible con Vercel
  },
  // Desactivar linting y typechecking en build para acelerar el proceso
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;