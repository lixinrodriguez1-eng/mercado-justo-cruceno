"use client";
// =============================================================
// Catálogo general: filtros por rubro, barrio y emprendedor + buscador.
// Los productos ya llegaron del servidor; aquí solo se filtran en memoria,
// por eso la respuesta es instantánea incluso con conexión lenta (3G).
// Los filtros se reflejan en la URL (?rubro=...&barrio=...) para poder
// compartir el enlace, sin recargar la página.
// =============================================================
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { BarrioDTO, OpcionDTO, ProductoDTO } from "@/lib/tipos";
import { IconoBuscar, IconoCerrar } from "./Iconos";
import { TarjetaProducto } from "./TarjetaProducto";

// Quita tildes y pasa a minúsculas: "Cerámica" y "ceramica" coinciden
const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// WPO: se muestran 12 tarjetas y luego "Mostrar más". Así el celular dibuja e
// hidrata menos elementos al cargar (menos TBT) y descarga menos fotos.
const POR_PAGINA = 12;

export interface FiltrosCatalogo {
  rubro: string;
  barrio: string;
  emprendedor: string;
  q: string;
}

interface Props {
  productos: ProductoDTO[];
  rubros: OpcionDTO[];
  barrios: BarrioDTO[];
  emprendedores: { slug: string; nombre: string }[];
  inicial: FiltrosCatalogo;
}

export function CatalogoInteractivo({ productos, rubros, barrios, emprendedores, inicial }: Props) {
  const [filtros, setFiltros] = useState(inicial);
  const [limite, setLimite] = useState(POR_PAGINA);
  // useDeferredValue mantiene fluido el campo de texto mientras se filtra
  const busqueda = useDeferredValue(filtros.q);
  const cambiar = (campo: keyof FiltrosCatalogo, valor: string) => {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setLimite(POR_PAGINA);
  };

  // Solo se ofrecen los rubros y barrios que tienen productos
  const rubrosConProductos = rubros.filter((r) => productos.some((p) => p.emprendedor.rubro.slug === r.slug));
  const barriosConProductos = barrios.filter((b) => productos.some((p) => p.emprendedor.barrio.slug === b.slug));

  const filtrados = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return productos.filter(
      (p) =>
        (!filtros.rubro || p.emprendedor.rubro.slug === filtros.rubro) &&
        (!filtros.barrio || p.emprendedor.barrio.slug === filtros.barrio) &&
        (!filtros.emprendedor || p.emprendedor.slug === filtros.emprendedor) &&
        (!termino || normalizar(`${p.nombre} ${p.descripcion} ${p.emprendedor.emprendimiento}`).includes(termino)),
    );
  }, [productos, filtros.rubro, filtros.barrio, filtros.emprendedor, busqueda]);

  // Refleja los filtros en la URL sin navegar (enlace compartible)
  useEffect(() => {
    const params = new URLSearchParams();
    for (const [clave, valor] of Object.entries({ ...filtros, q: busqueda.trim() }))
      if (valor) params.set(clave, valor);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [filtros, busqueda]);

  const hayFiltros = Object.values(filtros).some(Boolean);
  const limpiar = () => setFiltros({ rubro: "", barrio: "", emprendedor: "", q: "" });

  return (
    <div className="mt-8">
      {/* Barra de filtros */}
      <div className="rounded-2xl border border-crema-200 bg-crema-50 p-3 sm:p-4">
        <div role="group" aria-label="Filtrar por rubro" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {[{ slug: "", nombre: "Todos los rubros" }, ...rubrosConProductos].map((r) => (
            <button
              key={r.slug || "todos"}
              type="button"
              onClick={() => cambiar("rubro", r.slug)}
              aria-pressed={filtros.rubro === r.slug}
              className="min-h-11 shrink-0 cursor-pointer rounded-full border-2 border-cafe-700/20 px-4 text-sm font-bold text-cafe-700 transition-colors duration-200 hover:border-cafe-700 aria-pressed:border-cafe-800 aria-pressed:bg-cafe-800 aria-pressed:text-crema-50"
            >
              {r.nombre}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="filtro-barrio" className="etiqueta">
              Barrio
            </label>
            <select
              id="filtro-barrio"
              value={filtros.barrio}
              onChange={(e) => cambiar("barrio", e.target.value)}
              className="campo"
            >
              <option value="">Todos los barrios</option>
              {barriosConProductos.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filtro-emprendedor" className="etiqueta">
              Emprendedor
            </label>
            <select
              id="filtro-emprendedor"
              value={filtros.emprendedor}
              onChange={(e) => cambiar("emprendedor", e.target.value)}
              className="campo"
            >
              <option value="">Todos los emprendedores</option>
              {emprendedores.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <label htmlFor="buscar" className="etiqueta">
              Buscar
            </label>
            <IconoBuscar className="pointer-events-none absolute bottom-3 left-3.5 size-5 text-cafe-500" />
            <input
              id="buscar"
              type="search"
              value={filtros.q}
              onChange={(e) => cambiar("q", e.target.value)}
              placeholder="miel, cerámica, pan…"
              className="campo pr-10 pl-11"
              autoComplete="off"
              maxLength={100}
            />
            {filtros.q && (
              <button
                type="button"
                onClick={() => cambiar("q", "")}
                className="absolute right-1.5 bottom-1 grid size-9 cursor-pointer place-items-center rounded-full text-cafe-600 hover:bg-crema-200"
                aria-label="Borrar búsqueda"
              >
                <IconoCerrar className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Anuncia la cantidad de resultados a lectores de pantalla */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-cafe-600" aria-live="polite">
          {filtrados.length} producto{filtrados.length === 1 ? "" : "s"}
          {busqueda.trim() && ` para “${busqueda.trim()}”`}
        </p>
        {hayFiltros && (
          <button type="button" onClick={limpiar} className="btn-fantasma min-h-9 py-1">
            Quitar filtros
          </button>
        )}
      </div>

      {filtrados.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtrados.slice(0, limite).map((p, i) => (
            // WPO: la 1.ª foto es el LCP en móvil → prioridad alta; la 2.ª se pide
            // de inmediato; las demás usan lazy loading.
            <TarjetaProducto key={p.id} producto={p} prioridad={i === 0 ? "alta" : i === 1 ? "normal" : "diferida"} />
          ))}
        </div>
      ) : null}
      {filtrados.length > limite && (
        <div className="mt-8 text-center">
          <button type="button" onClick={() => setLimite((l) => l + POR_PAGINA)} className="btn-secundario px-8">
            Mostrar más ({filtrados.length - limite} restantes)
          </button>
        </div>
      )}
      {filtrados.length === 0 && (
        <div className="tarjeta mt-4 p-10 text-center">
          <p className="font-titulo text-2xl font-bold">No encontramos productos</p>
          <p className="mt-2 text-cafe-600">Prueba con otra palabra, otro barrio u otro rubro.</p>
          <button type="button" onClick={limpiar} className="btn-secundario mt-5">
            Quitar filtros
          </button>
        </div>
      )}
    </div>
  );
}
