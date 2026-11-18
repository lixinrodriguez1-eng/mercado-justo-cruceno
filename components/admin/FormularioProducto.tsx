"use client";
// Formulario para crear o editar un producto (POST / PUT a /api/admin/productos)
import { useState } from "react";
import { pedirApi } from "@/lib/cliente-api";
import type { CategoriaDTO, ProductoDTO } from "@/lib/tipos";
import { ImagenProducto } from "../ImagenProducto";

interface Props {
  producto: ProductoDTO | null; // null = crear nuevo
  categorias: CategoriaDTO[];
  onGuardado: (producto: ProductoDTO) => void;
  onCancelar: () => void;
}

export function FormularioProducto({ producto, categorias, onGuardado, onCancelar }: Props) {
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? "",
    descripcion: producto?.descripcion ?? "",
    precio: producto ? String(producto.precio) : "",
    categoriaId: producto ? String(producto.categoriaId) : "",
    imagen: producto?.imagen ?? "",
    disponible: producto?.disponible ?? true,
    destacado: producto?.destacado ?? false,
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  // Al editar un campo, su mensaje de error desaparece
  const actualizar = (campo: keyof typeof form, valor: string | boolean) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((previos) => {
      const resto = { ...previos };
      delete resto[campo];
      return resto;
    });
  };

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErrores({});
    const r = await pedirApi<ProductoDTO>(
      producto ? `/api/admin/productos/${producto.id}` : "/api/admin/productos",
      {
        method: producto ? "PUT" : "POST",
        body: JSON.stringify({ ...form, precio: Number(form.precio), categoriaId: Number(form.categoriaId) }),
      },
    );
    setEnviando(false);
    if (r.ok && r.datos) onGuardado(r.datos);
    else setErrores({ general: r.error ?? "No se pudo guardar.", ...r.errores });
  }

  // Props comunes de accesibilidad para cada campo con posible error
  const a11y = (campo: string) => ({
    id: `p-${campo}`,
    "aria-invalid": !!errores[campo],
    "aria-describedby": errores[campo] ? `p-${campo}-error` : undefined,
  });
  const mensajeError = (campo: string) =>
    errores[campo] ? <p id={`p-${campo}-error`} className="error-campo">{errores[campo]}</p> : null;

  let imagenValida = false;
  try {
    imagenValida = form.imagen.startsWith("/") || new URL(form.imagen).protocol === "https:";
  } catch {}

  return (
    <form onSubmit={guardar} noValidate className="space-y-4">
      <div>
        <label htmlFor="p-nombre" className="etiqueta">Nombre</label>
        <input {...a11y("nombre")} className="campo" maxLength={100} required value={form.nombre} onChange={(e) => actualizar("nombre", e.target.value)} />
        {mensajeError("nombre")}
      </div>

      <div>
        <label htmlFor="p-descripcion" className="etiqueta">Descripción</label>
        <textarea {...a11y("descripcion")} className="campo resize-y" rows={3} maxLength={1000} required value={form.descripcion} onChange={(e) => actualizar("descripcion", e.target.value)} />
        {mensajeError("descripcion")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-precio" className="etiqueta">Precio (Bs)</label>
          <input {...a11y("precio")} className="campo" type="number" inputMode="decimal" min="0.5" max="10000" step="0.5" required value={form.precio} onChange={(e) => actualizar("precio", e.target.value)} />
          {mensajeError("precio")}
        </div>
        <div>
          <label htmlFor="p-categoriaId" className="etiqueta">Categoría</label>
          <select {...a11y("categoriaId")} className="campo" required value={form.categoriaId} onChange={(e) => actualizar("categoriaId", e.target.value)}>
            <option value="">Selecciona…</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          {mensajeError("categoriaId")}
        </div>
      </div>

      <div>
        <label htmlFor="p-imagen" className="etiqueta">URL de la imagen</label>
        <input {...a11y("imagen")} className="campo" type="url" required placeholder="https://images.unsplash.com/photo-..." value={form.imagen} onChange={(e) => actualizar("imagen", e.target.value)} />
        <p className="mt-1 text-xs text-cafe-600">Recomendado: imágenes de images.unsplash.com (se optimizan automáticamente).</p>
        {mensajeError("imagen")}
        {imagenValida && (
          <div className="relative mt-3 aspect-[4/3] w-40 overflow-hidden rounded-xl bg-crema-200">
            <ImagenProducto src={form.imagen} alt="Vista previa" sizes="160px" />
          </div>
        )}
      </div>

      <fieldset className="flex flex-wrap gap-6">
        <legend className="sr-only">Opciones</legend>
        <label className="flex cursor-pointer items-center gap-2 font-semibold">
          <input type="checkbox" className="size-5 accent-acento-500" checked={form.disponible} onChange={(e) => actualizar("disponible", e.target.checked)} />
          Disponible para pedir
        </label>
        <label className="flex cursor-pointer items-center gap-2 font-semibold">
          <input type="checkbox" className="size-5 accent-acento-500" checked={form.destacado} onChange={(e) => actualizar("destacado", e.target.checked)} />
          Destacado en el inicio
        </label>
      </fieldset>

      {errores.general && (
        <p role="alert" className="rounded-xl bg-error/10 p-3 text-sm font-semibold text-error">{errores.general}</p>
      )}

      <div className="flex justify-end gap-2 border-t border-crema-200 pt-4">
        <button type="button" onClick={onCancelar} className="btn-fantasma">Cancelar</button>
        <button type="submit" disabled={enviando} className="btn-primario">
          {enviando ? "Guardando…" : producto ? "Guardar cambios" : "Crear producto"}
        </button>
      </div>
    </form>
  );
}
