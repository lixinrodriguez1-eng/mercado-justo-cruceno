"use client";
// =============================================================
// Lista de pedidos del panel.
// - Filtro por estado
// - Cambio de estado con PATCH /api/admin/pedidos/:id
// - Se actualiza sola cada 20 s (GET /api/admin/pedidos) para ver pedidos nuevos
// =============================================================
import { useCallback, useEffect, useMemo, useState } from "react";
import { pedirApi } from "@/lib/cliente-api";
import { ETIQUETA_ESTADO, formatearFecha, formatearPrecio } from "@/lib/negocio";
import { ESTADOS_PEDIDO, type EstadoPedido, type PedidoDTO } from "@/lib/tipos";
import { EstadoBadge } from "../EstadoBadge";

const INTERVALO_MS = 20_000;
const SIGUIENTE: Partial<Record<EstadoPedido, { estado: EstadoPedido; texto: string }>> = {
  PENDIENTE: { estado: "PREPARANDO", texto: "Empezar a preparar" },
  PREPARANDO: { estado: "ENTREGADO", texto: "Marcar entregado" },
};

/** ¿La fecha ISO corresponde a hoy en Bolivia? */
const esHoy = (iso: string) => {
  const f = (d: Date) => d.toLocaleDateString("es-BO", { timeZone: "America/La_Paz" });
  return f(new Date(iso)) === f(new Date());
};

export function GestorPedidos({ pedidosIniciales }: { pedidosIniciales: PedidoDTO[] }) {
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const [filtro, setFiltro] = useState<EstadoPedido | "TODOS">("TODOS");
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [actualizado, setActualizado] = useState<Date | null>(null);
  const [cargando, setCargando] = useState(false);

  const recargar = useCallback(async () => {
    setCargando(true);
    const r = await pedirApi<PedidoDTO[]>("/api/admin/pedidos");
    setCargando(false);
    if (r.ok && r.datos) {
      setPedidos(r.datos);
      setActualizado(new Date());
      setError("");
    } else setError(r.error ?? "No se pudo actualizar la lista.");
  }, []);

  // Actualización automática solo mientras la pestaña está visible
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") recargar();
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [recargar]);

  async function cambiarEstado(pedido: PedidoDTO, estado: EstadoPedido) {
    if (estado === pedido.estado) return;
    setOcupado(pedido.id);
    const r = await pedirApi<PedidoDTO>(`/api/admin/pedidos/${pedido.id}`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
    setOcupado(null);
    if (r.ok && r.datos) {
      const actualizado = r.datos;
      setPedidos((lista) => lista.map((p) => (p.id === actualizado.id ? actualizado : p)));
      setError("");
    } else setError(r.error ?? "No se pudo cambiar el estado.");
  }

  const conteo = useMemo(() => {
    const c = { TODOS: pedidos.length, PENDIENTE: 0, PREPARANDO: 0, ENTREGADO: 0 };
    for (const p of pedidos) c[p.estado]++;
    return c;
  }, [pedidos]);

  const deHoy = pedidos.filter((p) => esHoy(p.fecha));
  const ventasHoy = deHoy.reduce((s, p) => s + p.total, 0);
  const visibles = filtro === "TODOS" ? pedidos : pedidos.filter((p) => p.estado === filtro);

  return (
    <div className="mt-6">
      {/* Resumen del día */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { n: String(deHoy.length), t: "Pedidos de hoy" },
          { n: formatearPrecio(ventasHoy), t: "Ventas de hoy" },
          { n: String(conteo.PENDIENTE), t: "Pendientes" },
          { n: String(conteo.PREPARANDO), t: "En preparación" },
        ].map((c) => (
          <div key={c.t} className="tarjeta p-4">
            <p className="font-titulo text-2xl font-bold tabular-nums sm:text-3xl">{c.n}</p>
            <p className="text-sm font-semibold text-cafe-600">{c.t}</p>
          </div>
        ))}
      </div>

      {/* Filtros por estado */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
          {(["TODOS", ...ESTADOS_PEDIDO] as const).map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setFiltro(e)}
              aria-pressed={filtro === e}
              className="min-h-11 cursor-pointer rounded-full border-2 border-cafe-700/20 px-4 text-sm font-bold text-cafe-700 transition-colors duration-200 hover:border-cafe-700 aria-pressed:border-cafe-800 aria-pressed:bg-cafe-800 aria-pressed:text-crema-50"
            >
              {e === "TODOS" ? "Todos" : ETIQUETA_ESTADO[e]} ({conteo[e]})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm text-cafe-600">
          {actualizado && <span>Actualizado {actualizado.toLocaleTimeString("es-BO", { timeStyle: "short" })}</span>}
          <button type="button" onClick={recargar} disabled={cargando} className="btn-secundario">
            {cargando ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-error/10 p-3 text-sm font-semibold text-error">
          {error}
        </p>
      )}

      {visibles.length === 0 ? (
        <div className="tarjeta mt-4 p-10 text-center text-cafe-600">No hay pedidos en esta vista.</div>
      ) : (
        <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((p) => {
            const siguiente = SIGUIENTE[p.estado];
            return (
              <li key={p.id} className={`tarjeta flex flex-col p-5 ${p.estado === "PENDIENTE" ? "ring-2 ring-amber-300" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-titulo text-xl font-bold tabular-nums">#{String(p.id).padStart(5, "0")}</p>
                    <p className="text-sm text-cafe-600">{formatearFecha(p.fecha)}</p>
                  </div>
                  <EstadoBadge estado={p.estado} />
                </div>

                <p className="mt-3 font-bold">{p.cliente}</p>
                <a href={`tel:${p.telefono}`} className="text-sm text-acento-600 underline-offset-2 hover:underline">
                  {p.telefono}
                </a>

                <ul className="mt-3 space-y-1 border-t border-crema-200 pt-3 text-sm">
                  {p.detalles.map((d) => (
                    <li key={d.id} className="flex justify-between gap-3">
                      <span><strong className="tabular-nums">{d.cantidad}×</strong> {d.nombreProducto}</span>
                      <span className="tabular-nums">{formatearPrecio(d.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                {p.nota && <p className="mt-2 rounded-lg bg-crema-100 p-2 text-sm"><strong>Nota:</strong> {p.nota}</p>}

                <p className="mt-3 flex justify-between border-t border-crema-200 pt-3 font-extrabold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatearPrecio(p.total)}</span>
                </p>

                <div className="mt-4 flex flex-1 items-end gap-2">
                  <div className="flex-1">
                    <label htmlFor={`estado-${p.id}`} className="sr-only">Estado del pedido {p.id}</label>
                    <select
                      id={`estado-${p.id}`}
                      value={p.estado}
                      disabled={ocupado === p.id}
                      onChange={(e) => cambiarEstado(p, e.target.value as EstadoPedido)}
                      className="campo mt-0 py-2"
                    >
                      {ESTADOS_PEDIDO.map((e) => (
                        <option key={e} value={e}>{ETIQUETA_ESTADO[e]}</option>
                      ))}
                    </select>
                  </div>
                  {siguiente && (
                    <button type="button" disabled={ocupado === p.id} onClick={() => cambiarEstado(p, siguiente.estado)} className="btn-primario px-4">
                      {siguiente.texto}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
