// Imagen de producto reutilizable basada en next/image.
// - Las imágenes de Unsplash se optimizan (AVIF/WebP y tamaño según pantalla).
// - Si el admin pega una URL de otro dominio, se muestra sin optimizar
//   para que no falle (next/image solo optimiza dominios permitidos).
//
// WPO – carga diferida (lazy loading):
// next/image usa loading="lazy" por defecto, así que las fotos que están
// fuera de pantalla no se descargan hasta que el usuario se acerca a ellas.
// Solo la imagen que probablemente sea el LCP (la primera tarjeta) se pide
// de inmediato y con prioridad alta. En Next.js 16 la prop `priority` quedó
// obsoleta; la documentación recomienda loading="eager" + fetchPriority="high".
import Image from "next/image";

const DOMINIOS_OPTIMIZADOS = ["images.unsplash.com", "plus.unsplash.com"];

function sePuedeOptimizar(src: string) {
  if (src.startsWith("/")) return true;
  try {
    return DOMINIOS_OPTIMIZADOS.includes(new URL(src).hostname);
  } catch {
    return false;
  }
}

interface Props {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  /**
   * "alta"   → probable LCP: se descarga ya y con prioridad alta.
   * "normal" → visible al cargar pero no es el LCP: se descarga ya.
   * "diferida" (por defecto) → lazy loading nativo del navegador.
   */
  prioridad?: "alta" | "normal" | "diferida";
}

export function ImagenProducto({ src, alt, sizes, className = "", prioridad = "diferida" }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      // WPO: 60 es suficiente para miniaturas de 280 px y pesa ~20 % menos que 70
      quality={60}
      loading={prioridad === "diferida" ? "lazy" : "eager"}
      fetchPriority={prioridad === "alta" ? "high" : undefined}
      unoptimized={!sePuedeOptimizar(src)}
      className={`object-cover ${className}`}
    />
  );
}
