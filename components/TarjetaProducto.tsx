// Tarjeta de producto reutilizable (inicio, catálogo y página del emprendedor).
// Muestra lo que pide el comercio justo: QUIÉN lo produce, DÓNDE, CUÁNTO recibe
// el productor y un canal DIRECTO (WhatsApp) sin intermediarios.
import Link from "next/link";
import type { ComponentProps } from "react";
import { COMISION_PORCENTAJE, desglosarMonto, enlaceWhatsApp, formatearPrecio } from "@/lib/negocio";
import type { ProductoDTO } from "@/lib/tipos";
import { BotonAgregar } from "./carrito/BotonAgregar";
import { IconoMensaje, IconoUbicacion } from "./Iconos";
import { ImagenProducto } from "./ImagenProducto";

interface Props {
  producto: ProductoDTO;
  // WPO: "alta" solo en la primera tarjeta visible (probable LCP);
  // el resto se carga en diferido (lazy loading).
  prioridad?: ComponentProps<typeof ImagenProducto>["prioridad"];
  mostrarEmprendedor?: boolean;
}

export function TarjetaProducto({ producto, prioridad = "diferida", mostrarEmprendedor = true }: Props) {
  const { emprendedor } = producto;
  const { productor } = desglosarMonto(producto.precio);
  const mensaje = `Hola ${emprendedor.emprendimiento}, vi "${producto.nombre}" en Mercado Justo Cruceño y quiero consultar.`;

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
          {emprendedor.rubro.nombre}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {mostrarEmprendedor && (
          <p className="mb-1 flex flex-wrap items-center gap-x-2 text-xs font-bold text-cafe-600">
            <Link
              href={`/emprendedores/${emprendedor.slug}`}
              className="text-acento-600 underline-offset-2 hover:underline"
            >
              {emprendedor.emprendimiento}
            </Link>
            <span className="inline-flex items-center gap-0.5">
              <IconoUbicacion className="size-3.5" />
              {emprendedor.barrio.nombre}
            </span>
          </p>
        )}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg leading-tight font-bold text-cafe-900">{producto.nombre}</h3>
          <p className="shrink-0 font-extrabold text-acento-600">{formatearPrecio(producto.precio)}</p>
        </div>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-cafe-600">{producto.descripcion}</p>

        {/* Comercio justo visible: cuánto llega al productor */}
        <p className="mt-3 rounded-lg bg-exito/10 px-3 py-1.5 text-xs font-bold text-exito">
          El productor recibe {formatearPrecio(productor)} ({100 - COMISION_PORCENTAJE} %) · comisión{" "}
          {COMISION_PORCENTAJE} %
        </p>

        <div className="mt-3 flex gap-2">
          <a
            href={enlaceWhatsApp(emprendedor.whatsapp, mensaje)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn shrink-0 border-2 border-exito px-3 text-exito hover:bg-exito hover:text-white"
            aria-label={`Escribir por WhatsApp a ${emprendedor.emprendimiento} sobre ${producto.nombre}`}
          >
            <IconoMensaje />
            <span className="sr-only sm:not-sr-only">WhatsApp</span>
          </a>
          {/* WPO: al componente cliente solo le pasamos lo que usa */}
          <BotonAgregar
            producto={{
              id: producto.id,
              nombre: producto.nombre,
              precio: producto.precio,
              imagen: producto.imagen,
              emprendimiento: emprendedor.emprendimiento,
            }}
          />
        </div>
      </div>
    </article>
  );
}
