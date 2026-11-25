// Tarjeta de un emprendedor (inicio y listado de emprendedores).
import Link from "next/link";
import type { EmprendedorDTO } from "@/lib/tipos";
import { IconoUbicacion } from "./Iconos";
import { ImagenProducto } from "./ImagenProducto";

/** Iniciales para el avatar cuando no hay foto: "Rosa Mamani" → "RM" */
export const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

export function TarjetaEmprendedor({
  emprendedor,
  prioridad = "diferida",
}: {
  emprendedor: EmprendedorDTO;
  prioridad?: "alta" | "normal" | "diferida";
}) {
  const primerParrafo = emprendedor.historia.split("\n")[0];
  return (
    <article className="tarjeta group relative flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-elevada">
      <div className="relative aspect-[16/9] overflow-hidden bg-cafe-800">
        {emprendedor.foto ? (
          <ImagenProducto
            src={emprendedor.foto}
            alt=""
            prioridad={prioridad}
            sizes="(min-width: 1024px) 370px, (min-width: 640px) 45vw, 92vw"
            className="transition-transform duration-200 motion-safe:group-hover:scale-105"
          />
        ) : (
          <span className="grid h-full place-items-center font-titulo text-5xl font-bold text-crema-100">
            {iniciales(emprendedor.emprendimiento)}
          </span>
        )}
        <span className="absolute top-3 left-3 rounded-full bg-crema-50/95 px-3 py-1 text-xs font-bold text-cafe-700">
          {emprendedor.rubro.nombre}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-bold">
          {/* El enlace cubre toda la tarjeta (área táctil grande) */}
          <Link href={`/emprendedores/${emprendedor.slug}`} className="after:absolute after:inset-0">
            {emprendedor.emprendimiento}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-cafe-600">
          <IconoUbicacion className="size-4" /> {emprendedor.barrio.nombre} · {emprendedor.nombre}
        </p>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-cafe-700">{primerParrafo}</p>
        {emprendedor.cantidadProductos !== undefined && (
          <p className="mt-4 text-sm font-bold text-acento-600">
            {emprendedor.cantidadProductos} producto{emprendedor.cantidadProductos === 1 ? "" : "s"} · Ver historia →
          </p>
        )}
      </div>
    </article>
  );
}
