"use client";
// =============================================================
// Administración: revisión de solicitudes de emprendedores.
// - Aprobar / quitar aprobación   → PATCH /api/admin/emprendedores/:id { aprobado }
// - Suspender / reactivar cuenta  → PATCH /api/admin/emprendedores/:id { activo }
// Las solicitudes pendientes aparecen primero.
// =============================================================
import Link from "next/link";
import { useState } from "react";
import { pedirApi } from "@/lib/cliente-api";
import { formatearFecha } from "@/lib/negocio";
import type { EmprendedorDTO } from "@/lib/tipos";

type Filtro = "todos" | "pendientes" | "aprobados";

export function GestorEmprendedores({ iniciales }: { iniciales: EmprendedorDTO[] }) {
  const [lista, setLista] = useState(iniciales);
  const [filtro, setFiltro] = useState<Filtro>(iniciales.some((e) => !e.aprobado) ? "pendientes" : "todos");
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [abierto, setAbierto] = useState<number | null>(null);

  async function moderar(e: EmprendedorDTO, cambio: { aprobado?: boolean; activo?: boolean }) {
    setOcupado(e.id);
    const r = await pedirApi<EmprendedorDTO>(`/api/admin/emprendedores/${e.id}`, {
      method: "PATCH",
      body: JSON.stringify(cambio),
    });
    setOcupado(null);
    if (r.ok && r.datos) {
      const nuevo = r.datos;
      setLista((l) => l.map((x) => (x.id === nuevo.id ? nuevo : x)));
      setError("");
    } else setError(r.error ?? "No se pudo guardar el cambio.");
  }

  const pendientes = lista.filter((e) => !e.aprobado).length;
  const visibles = lista.filter((e) => filtro === "todos" || (filtro === "pendientes" ? !e.aprobado : e.aprobado));

  return (
    <div className="mt-6">
      <div role="group" aria-label="Filtrar solicitudes" className="flex flex-wrap gap-2">
        {(
          [
            ["pendientes", `Pendientes (${pendientes})`],
            ["aprobados", `Aprobados (${lista.length - pendientes})`],
            ["todos", `Todos (${lista.length})`],
          ] as const
        ).map(([valor, texto]) => (
          <button
            key={valor}
            type="button"
            onClick={() => setFiltro(valor)}
            aria-pressed={filtro === valor}
            className="min-h-11 cursor-pointer rounded-full border-2 border-cafe-700/20 px-4 text-sm font-bold text-cafe-700 transition-colors duration-200 hover:border-cafe-700 aria-pressed:border-cafe-800 aria-pressed:bg-cafe-800 aria-pressed:text-crema-50"
          >
            {texto}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-error/10 p-3 text-sm font-semibold text-error">
          {error}
        </p>
      )}

      {visibles.length === 0 ? (
        <div className="tarjeta mt-4 p-10 text-center text-cafe-600">No hay emprendedores en esta vista.</div>
      ) : (
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          {visibles.map((e) => (
            <li key={e.id} className={`tarjeta flex flex-col p-5 ${e.aprobado ? "" : "ring-2 ring-amber-300"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-titulo text-xl font-bold">{e.emprendimiento}</p>
                  <p className="text-sm text-cafe-600">
                    {e.nombre} · {e.rubro.nombre} · {e.barrio.nombre}
                  </p>
                  <p className="text-sm break-all text-cafe-600">
                    {e.email} · WhatsApp {e.whatsapp.replace(/^591/, "")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${e.aprobado ? "bg-emerald-100 text-emerald-900 ring-emerald-300" : "bg-amber-100 text-amber-900 ring-amber-300"}`}
                  >
                    {e.aprobado ? "Aprobado" : "Pendiente"}
                  </span>
                  {e.activo === false && (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-extrabold text-red-900 ring-1 ring-red-300">
                      Suspendido
                    </span>
                  )}
                </div>
              </div>

              <p
                className={`mt-3 text-sm leading-relaxed whitespace-pre-line text-cafe-700 ${abierto === e.id ? "" : "line-clamp-3"}`}
              >
                {e.historia}
              </p>
              <button
                type="button"
                onClick={() => setAbierto(abierto === e.id ? null : e.id)}
                className="mt-1 cursor-pointer self-start text-sm font-bold text-acento-600 hover:underline"
              >
                {abierto === e.id ? "Ver menos" : "Leer historia completa"}
              </button>
              <p className="mt-2 text-xs text-cafe-500">
                Registrado el {formatearFecha(e.creadoEn)} · {e.cantidadProductos ?? 0} productos
              </p>

              <div className="mt-4 flex flex-1 flex-wrap items-end gap-2">
                {e.aprobado ? (
                  <button
                    type="button"
                    disabled={ocupado === e.id}
                    onClick={() => moderar(e, { aprobado: false })}
                    className="btn-secundario"
                  >
                    Quitar aprobación
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={ocupado === e.id}
                    onClick={() => moderar(e, { aprobado: true })}
                    className="btn-primario"
                  >
                    Aprobar emprendedor
                  </button>
                )}
                <button
                  type="button"
                  disabled={ocupado === e.id}
                  onClick={() => moderar(e, { activo: e.activo === false })}
                  className="btn-fantasma text-error"
                >
                  {e.activo === false ? "Reactivar cuenta" : "Suspender cuenta"}
                </button>
                {e.aprobado && e.activo !== false && (
                  <Link href={`/emprendedores/${e.slug}`} className="btn-fantasma ml-auto">
                    Ver página pública →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
