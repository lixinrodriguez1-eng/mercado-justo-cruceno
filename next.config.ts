import type { NextConfig } from "next";

// =============================================================
// Seguridad frontend – cabeceras HTTP (OWASP A02:2025 Security Misconfiguration
// y A05:2025 Injection/XSS). Se envían en TODAS las respuestas.
// =============================================================
const esDesarrollo = process.env.NODE_ENV === "development";

// Content-Security-Policy: lista blanca de orígenes desde donde el navegador
// puede cargar scripts, estilos, imágenes, fuentes y a dónde puede conectarse.
const csp = [
  "default-src 'self'",
  // Next.js inserta pequeños <script> en línea con los datos de React (RSC).
  // Para permitirlos sin 'unsafe-inline' habría que usar un nonce por petición,
  // lo que obliga a renderizar TODO en cada visita y anula el pre-renderizado
  // (empeora el LCP en 3G). Se eligió esta variante, documentada por Next.js,
  // y la protección contra XSS se apoya además en el escape automático de React
  // y en la desinfección del servidor (lib/validacion.ts).
  // 'unsafe-eval' solo en desarrollo (React lo usa para depurar).
  `script-src 'self' 'unsafe-inline'${esDesarrollo ? " 'unsafe-eval'" : ""}`,
  // next/image y next/font usan atributos style en línea
  "style-src 'self' 'unsafe-inline'",
  // Fotos optimizadas (/_next/image = 'self') y URLs https que pegue el admin
  "img-src 'self' data: blob: https:",
  // next/font descarga Google Fonts en el build y las sirve desde el propio sitio
  "font-src 'self'",
  // fetch() solo hacia nuestra propia API: impide enviar datos robados a otro dominio
  "connect-src 'self'",
  "object-src 'none'", // sin Flash/applets/plugins
  "base-uri 'self'", // impide cambiar la URL base con <base href>
  "form-action 'self'", // los formularios solo se envían a este sitio
  "frame-ancestors 'none'", // nadie puede meter la página en un iframe (clickjacking)
].join("; ");

const cabecerasSeguridad = [
  { key: "Content-Security-Policy", value: csp },
  // Impide que el navegador "adivine" el tipo de archivo (MIME sniffing)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Al salir hacia otro sitio solo se envía el dominio, no la ruta completa
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Anti-clickjacking para navegadores antiguos (equivale a frame-ancestors)
  { key: "X-Frame-Options", value: "DENY" },
  // Desactiva APIs del dispositivo que la plataforma no necesita
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Aísla la ventana de otras pestañas abiertas desde otro origen
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HTTPS obligatorio durante 2 años. Los navegadores la ignoran en http://localhost;
  // entra en efecto cuando el sitio se publique con certificado TLS.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Rutas de la versión anterior (Café Chiquitano) → rutas de la plataforma
  async redirects() {
    return [
      { source: "/menu", destination: "/catalogo", permanent: true },
      { source: "/admin/login", destination: "/ingresar", permanent: true },
    ];
  },

  async headers() {
    return [
      // Páginas HTML y API: todas las cabeceras de seguridad
      { source: "/((?!_next/static|_next/image).*)", headers: cabecerasSeguridad },
      // WPO: los archivos estáticos (JS, CSS, fuentes, imágenes optimizadas) no
      // ejecutan la CSP; solo necesitan nosniff. Así se ahorran ~0,5 KB de
      // cabeceras en cada una de las ~20 peticiones de cada página en 3G.
      {
        source: "/_next/:tipo(static|image)/:path*",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },

  // Cache Components: la parte estática de cada página (hero, horarios, navbar)
  // se pre-renderiza y los datos de MySQL llegan en streaming en cada visita.
  cacheComponents: true,
  partialPrefetching: true,

  // ---------- WPO: compresión ----------
  // `next start` comprime con gzip el HTML, JS, CSS y JSON (es el valor por
  // defecto; se deja explícito para documentarlo en la auditoría).
  compress: true,

  // ---------- Seguridad: no revelar la tecnología del servidor ----------
  // Quita la cabecera "X-Powered-By: Next.js" (OWASP A02: mala configuración).
  poweredByHeader: false,

  // Nota de la auditoría: se probó `experimental.inlineCss` (CSS dentro del
  // HTML) y se descartó: el HTML del inicio pasó de 84 KB a 274 KB porque el
  // CSS se duplica en el payload RSC, y el TBT en 3G subió de ~360 a ~710 ms.

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
    // WPO: una sola calidad (60) para todas las fotos. Menos variantes en caché.
    qualities: [60],
    // WPO: anchos del srcset. Los valores por defecto llegan a 3840 px, pero
    // las fotos originales miden 800 px (productos) y 1600 px (hero): esos
    // anchos extra no aportan nitidez y alargan el HTML de cada <img>.
    // Se conserva 750: un celular de 412 px con densidad 1,75 necesita ~721 px;
    // sin 750 el navegador saltaría a 828 y descargaría ~15 % más.
    deviceSizes: [640, 750, 828, 1080, 1600],
    imageSizes: [64, 96, 160, 384],
    // WPO: las URLs de Unsplash no cambian de contenido → caché de 30 días
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
