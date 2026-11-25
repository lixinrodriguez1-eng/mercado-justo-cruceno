"use client";
// =============================================================
// Carrito + formulario de pedido.
// Al enviar, la compra se guarda en MySQL a través de POST /api/pedidos.
// El servidor recalcula los precios y reparte la compra en un pedido por
// emprendedor; lo que se muestra aquí es referencial.
// =============================================================
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatearPrecio } from "@/lib/negocio";
import type { CompraDTO, ItemCarrito } from "@/lib/tipos";
import { EsqueletoLista } from "../Esqueletos";
import { IconoBasura, IconoCarrito, IconoMas, IconoMenos } from "../Iconos";
import { ImagenProducto } from "../ImagenProducto";
import { MAX_POR_PRODUCTO, useCarrito } from "./CarritoProvider";

type Errores = Partial<Record<"cliente" | "telefono" | "nota" | "items" | "general", string>>;

/** Validación rápida en el navegador (la definitiva la hace el servidor) */
function validar(cliente: string, telefono: string): Errores {
  const errores: Errores = {};
  if (cliente.trim().length < 2) errores.cliente = "Ingresa tu nombre.";
  if (!/^(\+?591)?[2-7]\d{7}$/.test(telefono.replace(/[\s-]/g, "")))
    errores.telefono = "Ingresa un teléfono válido de 8 dígitos (ej. 71234567).";
  return errores;
}

/** Agrupa los ítems por emprendimiento (cada grupo será un pedido distinto) */
function agruparPorEmprendimiento(items: ItemCarrito[]) {
  const grupos = new Map<string, ItemCarrito[]>();
  for (const i of items) grupos.set(i.emprendimiento, [...(grupos.get(i.emprendimiento) ?? []), i]);
  return grupos;
}

export function Checkout() {
  const router = useRouter();
  const { items, subtotal, listo, cambiarCantidad, quitar, vaciar } = useCarrito();
  const [form, setForm] = useState({ cliente: "", telefono: "", nota: "" });
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [redirigiendo, setRedirigiendo] = useState(false);

  if (!listo || redirigiendo)
    return (
      <div className="mt-8">
        {redirigiendo && <p className="mb-4 font-bold text-exito">¡Pedido registrado! Abriendo tu confirmación…</p>}
        <EsqueletoLista filas={3} />
      </div>
    );

  if (items.length === 0)
    return (
      <div className="tarjeta mt-8 flex flex-col items-center p-10 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-crema-200 text-cafe-700">
          <IconoCarrito className="size-8" />
        </span>
        <p className="mt-4 font-titulo text-2xl font-bold">Tu carrito está vacío</p>
        <p className="mt-2 text-cafe-600">Explora el catálogo y apoya a un emprendedor de tu ciudad.</p>
        <Link href="/catalogo" className="btn-primario mt-6">
          Ir al catálogo
        </Link>
      </div>
    );

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const locales = validar(form.cliente, form.telefono);
    setErrores(locales);
    if (Object.keys(locales).length) {
      // Lleva el foco al primer campo con error (accesibilidad)
      document.getElementById(Object.keys(locales)[0])?.focus();
      return;
    }

    setEnviando(true);
    try {
      const respuesta = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
        }),
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setErrores({ general: datos.error ?? "No se pudo registrar el pedido.", ...datos.errores });
        return;
      }

      const compra = datos as CompraDTO;
      setRedirigiendo(true);
      router.push(`/pedido/${compra.codigo}`);
      vaciar();
    } catch {
      setErrores({ general: "No hay conexión con el servidor. Revisa tu internet e inténtalo otra vez." });
    } finally {
      setEnviando(false);
    }
  }

  const campo = (nombre: keyof typeof form) => ({
    id: nombre,
    name: nombre,
    value: form[nombre],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [nombre]: e.target.value })),
    "aria-invalid": !!errores[nombre],
    "aria-describedby": errores[nombre] ? `${nombre}-error` : undefined,
  });

  return (
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_400px]">
      {/* ---------- Lista del carrito ---------- */}
      <section aria-labelledby="titulo-carrito">
        <h2 id="titulo-carrito" className="sr-only">
          Productos en el carrito
        </h2>
        {[...agruparPorEmprendimiento(items)].map(([emprendimiento, grupo]) => (
          <section key={emprendimiento} className="mb-6" aria-label={`Productos de ${emprendimiento}`}>
            <p className="mb-2 flex items-center justify-between text-sm font-extrabold tracking-wide text-cafe-700 uppercase">
              <span>{emprendimiento}</span>
              <span className="font-bold normal-case text-exito">Recibe el 100 %</span>
            </p>
            <ul className="space-y-3">
              {grupo.map((item) => (
                <li key={item.productoId} className="tarjeta flex gap-4 p-3 sm:p-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-crema-200 sm:size-24">
                    <ImagenProducto src={item.imagen} alt={item.nombre} sizes="96px" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="leading-tight font-bold">{item.nombre}</h3>
                        <p className="text-sm text-cafe-600">{formatearPrecio(item.precio)} c/u</p>
                      </div>
                      <p className="font-extrabold text-cafe-900 tabular-nums">
                        {formatearPrecio(item.precio * item.cantidad)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-crema-300">
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.productoId, item.cantidad - 1)}
                          className="grid size-11 place-items-center rounded-full hover:bg-crema-200"
                          aria-label={`Quitar una unidad de ${item.nombre}`}
                        >
                          <IconoMenos />
                        </button>
                        <span className="w-8 text-center font-bold tabular-nums" aria-live="polite">
                          {item.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => cambiarCantidad(item.productoId, item.cantidad + 1)}
                          disabled={item.cantidad >= MAX_POR_PRODUCTO}
                          className="grid size-11 place-items-center rounded-full hover:bg-crema-200 disabled:opacity-40"
                          aria-label={`Agregar una unidad de ${item.nombre}`}
                        >
                          <IconoMas />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => quitar(item.productoId)}
                        className="btn-fantasma px-3 text-error"
                        aria-label={`Eliminar ${item.nombre} del carrito`}
                      >
                        <IconoBasura />
                        <span className="hidden sm:inline">Quitar</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <Link href="/catalogo" className="btn-fantasma">
          ← Seguir comprando
        </Link>
      </section>

      {/* ---------- Formulario del pedido ---------- */}
      <form
        onSubmit={enviar}
        noValidate
        className="tarjeta p-5 sm:p-6 lg:sticky lg:top-24"
        aria-labelledby="titulo-form"
      >
        <h2 id="titulo-form" className="text-2xl font-bold">
          Datos para el pedido
        </h2>
        <p className="mt-1 text-sm text-cafe-600">
          Cada emprendedor recibe su parte del pedido y te contacta por WhatsApp para coordinar la entrega. Pagas
          directo al productor (QR o efectivo), sin intermediarios.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="cliente" className="etiqueta">
              Nombre completo
            </label>
            <input
              {...campo("cliente")}
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              className="campo"
              placeholder="Ej. Ana Rojas"
            />
            {errores.cliente && (
              <p id="cliente-error" className="error-campo">
                {errores.cliente}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="telefono" className="etiqueta">
              Celular (WhatsApp)
            </label>
            <input
              {...campo("telefono")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={16}
              className="campo"
              placeholder="Ej. 71234567"
            />
            {errores.telefono && (
              <p id="telefono-error" className="error-campo">
                {errores.telefono}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="nota" className="etiqueta">
              Indicaciones <span className="font-normal text-cafe-500">(opcional)</span>
            </label>
            <textarea
              {...campo("nota")}
              rows={2}
              maxLength={255}
              className="campo resize-none"
              placeholder="Ej. entregar después de las 18:00"
            />
            {errores.nota && (
              <p id="nota-error" className="error-campo">
                {errores.nota}
              </p>
            )}
          </div>
        </div>

        <dl className="mt-6 space-y-2 border-t border-crema-200 pt-4">
          <div className="flex justify-between text-cafe-700">
            <dt>Productos</dt>
            <dd className="tabular-nums">{items.reduce((s, i) => s + i.cantidad, 0)}</dd>
          </div>
          <div className="flex justify-between text-xl font-extrabold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatearPrecio(subtotal)}</dd>
          </div>
        </dl>

        {(errores.general || errores.items) && (
          <div role="alert" className="mt-4 rounded-xl bg-error/10 p-3 text-sm font-semibold text-error">
            {errores.general}
            {errores.items && errores.items !== errores.general && <span className="block">{errores.items}</span>}
          </div>
        )}

        <button type="submit" disabled={enviando} className="btn-primario mt-5 w-full py-3 text-base">
          {enviando ? "Enviando pedido…" : "Confirmar pedido"}
        </button>
      </form>
    </div>
  );
}
