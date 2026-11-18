// Imagen de producto reutilizable basada en next/image.
// - Las imágenes de Unsplash se optimizan (AVIF/WebP y tamaño según pantalla).
// - Si el admin pega una URL de otro dominio, se muestra sin optimizar
//   para que no falle (next/image solo optimiza dominios permitidos).
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
  preload?: boolean;
}

export function ImagenProducto({ src, alt, sizes, className = "", preload = false }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={70}
      preload={preload}
      unoptimized={!sePuedeOptimizar(src)}
      className={`object-cover ${className}`}
    />
  );
}
