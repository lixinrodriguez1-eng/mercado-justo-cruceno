// Tarjeta de producto reutilizable (inicio y menú).
import type { ProductoDTO } from "@/lib/tipos";
import { formatearPrecio } from "@/lib/negocio";
import { ImagenProducto } from "./ImagenProducto";
import type { ComponentProps } from "react";
import { BotonAgregar } from "./carrito/BotonAgregar";

interface Props {
  producto: ProductoDTO;
  // WPO: "alta" solo en la primera tarjeta visible (probable LCP);
  // el resto se carga en diferido (lazy loading).
  prioridad?: ComponentProps<typeof ImagenProducto>["prioridad"];
}

export function TarjetaProducto({ producto, prioridad = "diferida" }: Props) {
  return (
    <article className="tarjeta group flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-elevada">
      <div className="relative aspect-[4/3] overflow-hidden bg-crema-200">
        <ImagenProducto
          src={producto.imagen}
          alt={producto.nombre}
          prioridad={prioridad}
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 92vw"
          className="transition-transform duration-200 motion-safe:group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 rounded-full bg-crema-50/95 px-3 py-1 text-xs font-bold text-cafe-700">
          {producto.categoria.nombre}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg leading-tight font-bold text-cafe-900">{producto.nombre}</h3>
          <p className="shrink-0 font-extrabold text-acento-600">{formatearPrecio(producto.precio)}</p>
        </div>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-cafe-600">{producto.descripcion}</p>
        {/* WPO: al componente cliente solo le pasamos lo que usa */}
        <BotonAgregar
          producto={{ id: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen }}
        />
      </div>
    </article>
  );
}
