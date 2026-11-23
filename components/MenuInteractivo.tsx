"use client";
// =============================================================
// Filtro por categoría + buscador reactivo (sin recargar la página).
// Los productos ya llegaron del servidor; aquí solo se filtran en memoria,
// por eso la respuesta es instantánea incluso con conexión lenta.
// =============================================================
import { useDeferredValue, useMemo, useState } from "react";
import type { CategoriaDTO, ProductoDTO } from "@/lib/tipos";
import { IconoBuscar, IconoCerrar } from "./Iconos";
import { TarjetaProducto } from "./TarjetaProducto";

// Quita tildes y pasa a minúsculas: "Café" y "cafe" coinciden
const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

interface Props {
  productos: ProductoDTO[];
  categorias: CategoriaDTO[];
}

export function MenuInteractivo({ productos, categorias }: Props) {
  const [categoria, setCategoria] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState("");
  // useDeferredValue mantiene fluido el campo de texto mientras se filtra
  const busquedaDiferida = useDeferredValue(busqueda);

  const filtrados = useMemo(() => {
    const termino = normalizar(busquedaDiferida.trim());
    return productos.filter(
      (p) =>
        (categoria === "todas" || p.categoria.slug === categoria) &&
        (!termino || normalizar(`${p.nombre} ${p.descripcion}`).includes(termino)),
    );
  }, [productos, categoria, busquedaDiferida]);

  const opciones = [{ slug: "todas", nombre: "Todo" }, ...categorias];
  const limpiar = () => {
    setCategoria("todas");
    setBusqueda("");
  };

  return (
    <div className="mt-8">
      {/* Barra de filtros: queda fija bajo la navbar al hacer scroll */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-crema-200 bg-crema-50 px-4 py-3 sm:mx-0 sm:rounded-2xl sm:border sm:px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div role="group" aria-label="Filtrar por categoría" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:pb-0">
            {opciones.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setCategoria(c.slug)}
                aria-pressed={categoria === c.slug}
                className="min-h-11 shrink-0 rounded-full border-2 border-cafe-700/20 px-4 text-sm font-bold text-cafe-700 transition-colors duration-200 hover:border-cafe-700 aria-pressed:border-cafe-800 aria-pressed:bg-cafe-800 aria-pressed:text-crema-50"
              >
                {c.nombre}
              </button>
            ))}
          </div>

          <div className="relative md:w-80">
            <label htmlFor="buscar" className="sr-only">
              Buscar en el menú
            </label>
            <IconoBuscar className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-cafe-500" />
            <input
              id="buscar"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar: latte, maracuyá, sándwich…"
              className="campo mt-0 rounded-full pr-10 pl-11"
              autoComplete="off"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                className="absolute top-1/2 right-1.5 grid size-9 -translate-y-1/2 place-items-center rounded-full text-cafe-600 hover:bg-crema-200"
                aria-label="Borrar búsqueda"
              >
                <IconoCerrar className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Anuncia la cantidad de resultados a lectores de pantalla */}
      <p className="mt-6 text-sm font-semibold text-cafe-600" aria-live="polite">
        {filtrados.length} producto{filtrados.length === 1 ? "" : "s"}
        {busquedaDiferida.trim() && ` para “${busquedaDiferida.trim()}”`}
      </p>

      {filtrados.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtrados.map((p, i) => (
            // WPO: la 1.ª foto es el LCP en móvil → prioridad alta; la 2.ª se pide
            // de inmediato; las demás usan lazy loading.
            <TarjetaProducto key={p.id} producto={p} prioridad={i === 0 ? "alta" : i === 1 ? "normal" : "diferida"} />
          ))}
        </div>
      ) : (
        <div className="tarjeta mt-4 p-10 text-center">
          <p className="font-titulo text-2xl font-bold">No encontramos productos</p>
          <p className="mt-2 text-cafe-600">Prueba con otra palabra o revisa otra categoría.</p>
          <button type="button" onClick={limpiar} className="btn-secundario mt-5">
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
