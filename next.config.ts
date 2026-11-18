import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: la parte estática de cada página (hero, horarios, navbar)
  // se pre-renderiza y los datos de MySQL llegan en streaming en cada visita.
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Dominios permitidos para optimizar imágenes con next/image
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
    formats: ["image/avif", "image/webp"],
    // Calidades permitidas: 60 para el hero (foto grande) y 70 para productos
    qualities: [60, 70, 75],
  },
};

export default nextConfig;
