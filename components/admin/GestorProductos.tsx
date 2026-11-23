"use client";
// =============================================================
// CRUD de productos en el panel de administración.
// - Crear / Editar: formulario en ventana modal (POST / PUT)
// - Disponible / Destacado: interruptores con PATCH inmediato
// - Eliminar: confirmación en modal (DELETE)
// =============================================================
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { pedirApi } from "@/lib/cliente-api";
import { formatearPrecio } from "@/lib/negocio";
import type { CategoriaDTO, ProductoDTO } from "@/lib/tipos";
import { IconoBasura, IconoBuscar, IconoEditar, IconoMas } from "../Iconos";
import { ImagenProducto } from "../ImagenProducto";
import { Dialogo } from "./Dialogo";
import { Interruptor } from "./Interruptor";

interface Props {
  productosIniciales: ProductoDTO[];
  categorias: CategoriaDTO[];
}

type Aviso = { tipo: "ok" | "error"; texto: string } | null;

// WPO – lazy loading con next/dynamic: el formulario (con su validación y
// vista previa de imagen) va en un chunk aparte que solo se descarga cuando
// el administrador abre "Nuevo producto" o "Editar". La lista carga antes.
const FormularioProducto = dynamic(
  () => import("./FormularioProducto").then((m) => m.FormularioProducto),
  { loading: () => <p className="p-4 text-center text-cafe-600">Cargando formulario…</p> },
);

export function GestorProductos({ productosIniciales, categorias }: Props) {
  const [productos, setProductos] = useState(productosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [editando, setEditando] = useState<ProductoDTO | "nuevo" | null>(null);
  const [eliminando, setEliminando] = useState<ProductoDTO | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null); // id en proceso
  const [aviso, setAviso] = useState<Aviso>(null);

  const visibles = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    return productos.filter(
      (p) => (!categoria || String(p.categoriaId) === categoria) && (!t || p.nombre.toLowerCase().includes(t)),
    );
  }, [productos, busqueda, categoria]);

  const reemplazar = (p: ProductoDTO) => setProductos((lista) => lista.map((x) => (x.id === p.id ? p : x)));

  // PATCH rápido de un campo booleano
  async function alternar(p: ProductoDTO, campo: "disponible" | "destacado") {
    setOcupado(p.id);
    reemplazar({ ...p, [campo]: !p[campo] }); // actualización optimista
    const r = await pedirApi<ProductoDTO>(`/api/admin/productos/${p.id}`, {
      method: "PATCH",
      body: JSON.stringify({ [campo]: !p[campo] }),
    });
    setOcupado(null);
    if (r.ok && r.datos) reemplazar(r.datos);
    else {
      reemplazar(p); // revertimos si falló
      setAviso({ tipo: "error", texto: r.error ?? "No se pudo actualizar." });
    }
  }

  function alGuardar(p: ProductoDTO) {
    const esNuevo = editando === "nuevo";
    setProductos((lista) => (esNuevo ? [...lista, p] : lista.map((x) => (x.id === p.id ? p : x))));
    setEditando(null);
    setAviso({ tipo: "ok", texto: esNuevo ? `“${p.nombre}” se creó correctamente.` : `“${p.nombre}” se actualizó.` });
  }

  async function confirmarEliminar() {
    if (!eliminando) return;
    const p = eliminando;
    setOcupado(p.id);
    const r = await pedirApi(`/api/admin/productos/${p.id}`, { method: "DELETE" });
    setOcupado(null);
    setEliminando(null);
    if (r.ok) {
      setProductos((lista) => lista.filter((x) => x.id !== p.id));
      setAviso({ tipo: "ok", texto: `“${p.nombre}” se eliminó.` });
    } else setAviso({ tipo: "error", texto: r.error ?? "No se pudo eliminar." });
  }

  const disponibles = productos.filter((p) => p.disponible).length;

  return (
    <div className="mt-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { n: productos.length, t: "Productos" },
          { n: disponibles, t: "Disponibles" },
          { n: productos.length - disponibles, t: "Agotados" },
        ].map((c) => (
          <div key={c.t} className="tarjeta p-4">
            <p className="font-titulo text-3xl font-bold tabular-nums">{c.n}</p>
            <p className="text-sm font-semibold text-cafe-600">{c.t}</p>
          </div>
        ))}
      </div>

      {/* Barra de herramientas */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <label htmlFor="buscar-admin" className="etiqueta">Buscar</label>
          <IconoBuscar className="pointer-events-none absolute bottom-3 left-3.5 size-5 text-cafe-500" />
          <input id="buscar-admin" type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre del producto" className="campo pl-11" />
        </div>
        <div className="sm:w-48">
          <label htmlFor="filtro-categoria" className="etiqueta">Categoría</label>
          <select id="filtro-categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} className="campo">
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={() => setEditando("nuevo")} className="btn-primario">
          <IconoMas /> Nuevo producto
        </button>
      </div>

      {aviso && (
        <div
          role="status"
          className={`mt-4 flex items-center justify-between gap-4 rounded-xl p-3 text-sm font-semibold ${
            aviso.tipo === "ok" ? "bg-exito/10 text-exito" : "bg-error/10 text-error"
          }`}
        >
          {aviso.texto}
          <button type="button" onClick={() => setAviso(null)} className="cursor-pointer underline">Cerrar</button>
        </div>
      )}

      {/* Lista: tarjetas en móvil, filas tipo tabla en escritorio */}
      <div className="tarjeta mt-4 overflow-hidden">
        <div className="hidden grid-cols-[64px_1fr_110px_110px_110px_100px] gap-4 border-b border-crema-200 bg-crema-50 px-4 py-3 text-xs font-extrabold tracking-wider text-cafe-600 uppercase lg:grid">
          <span>Foto</span><span>Producto</span><span>Precio</span><span>Disponible</span><span>Destacado</span><span className="text-right">Acciones</span>
        </div>
        <ul className="divide-y divide-crema-200">
          {visibles.map((p) => (
            <li key={p.id} className={`grid grid-cols-[64px_1fr] items-center gap-x-4 gap-y-3 p-4 lg:grid-cols-[64px_1fr_110px_110px_110px_100px] ${p.disponible ? "" : "bg-crema-50"}`}>
              <div className="relative size-16 overflow-hidden rounded-xl bg-crema-200">
                <ImagenProducto src={p.imagen} alt="" sizes="64px" className={p.disponible ? "" : "grayscale"} />
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold">{p.nombre}</p>
                <p className="text-sm text-cafe-600">
                  {p.categoria.nombre}
                  <span className="lg:hidden"> · {formatearPrecio(p.precio)}</span>
                </p>
              </div>
              <p className="hidden font-bold tabular-nums lg:block">{formatearPrecio(p.precio)}</p>

              {/* En móvil, interruptores y acciones ocupan una fila completa */}
              <div className="col-span-2 flex flex-wrap items-center justify-between gap-3 lg:contents">
                <label className="flex items-center gap-2 text-sm font-semibold lg:block">
                  <Interruptor activo={p.disponible} etiqueta={`Disponible: ${p.nombre}`} deshabilitado={ocupado === p.id} onCambiar={() => alternar(p, "disponible")} />
                  <span className="lg:sr-only">Disponible</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold lg:block">
                  <Interruptor activo={p.destacado} etiqueta={`Destacado: ${p.nombre}`} deshabilitado={ocupado === p.id} onCambiar={() => alternar(p, "destacado")} />
                  <span className="lg:sr-only">Destacado</span>
                </label>
                <div className="flex gap-1 lg:justify-end">
                  <button type="button" onClick={() => setEditando(p)} className="grid size-11 cursor-pointer place-items-center rounded-full text-cafe-700 hover:bg-crema-200" aria-label={`Editar ${p.nombre}`}>
                    <IconoEditar />
                  </button>
                  <button type="button" onClick={() => setEliminando(p)} className="grid size-11 cursor-pointer place-items-center rounded-full text-error hover:bg-error/10" aria-label={`Eliminar ${p.nombre}`}>
                    <IconoBasura />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {visibles.length === 0 && <p className="p-8 text-center text-cafe-600">No hay productos que coincidan.</p>}
      </div>

      {/* Modal crear / editar */}
      <Dialogo
        abierto={editando !== null}
        titulo={editando === "nuevo" ? "Nuevo producto" : "Editar producto"}
        onCerrar={() => setEditando(null)}
      >
        <FormularioProducto
          key={editando === "nuevo" ? "nuevo" : editando?.id}
          producto={editando === "nuevo" ? null : editando}
          categorias={categorias}
          onGuardado={alGuardar}
          onCancelar={() => setEditando(null)}
        />
      </Dialogo>

      {/* Modal confirmar eliminación */}
      <Dialogo abierto={eliminando !== null} titulo="Eliminar producto" onCerrar={() => setEliminando(null)} ancho="max-w-md">
        <p>
          ¿Seguro que quieres eliminar <strong>{eliminando?.nombre}</strong>? Esta acción no se puede deshacer.
        </p>
        <p className="mt-2 text-sm text-cafe-600">
          Los pedidos anteriores conservan su detalle. Si solo está agotado, mejor desactiva “Disponible”.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setEliminando(null)} className="btn-fantasma">Cancelar</button>
          <button type="button" onClick={confirmarEliminar} disabled={ocupado !== null} className="btn bg-error text-white hover:bg-error/90">
            Sí, eliminar
          </button>
        </div>
      </Dialogo>
    </div>
  );
}
