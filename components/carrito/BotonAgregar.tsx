"use client";
// Botón "Agregar al carrito" con confirmación visual breve.
import { useEffect, useState } from "react";
import type { ProductoDTO } from "@/lib/tipos";
import { IconoCheck, IconoMas } from "../Iconos";
import { MAX_POR_PRODUCTO, useCarrito } from "./CarritoProvider";

export function BotonAgregar({ producto }: { producto: ProductoDTO }) {
  const { agregar, items } = useCarrito();
  const [agregado, setAgregado] = useState(false);
  const enCarrito = items.find((i) => i.productoId === producto.id)?.cantidad ?? 0;
  const lleno = enCarrito >= MAX_POR_PRODUCTO;

  // El mensaje "¡Agregado!" desaparece después de 1,2 segundos
  useEffect(() => {
    if (!agregado) return;
    const t = setTimeout(() => setAgregado(false), 1200);
    return () => clearTimeout(t);
  }, [agregado]);

  return (
    <button
      type="button"
      disabled={lleno}
      onClick={() => {
        agregar(producto);
        setAgregado(true);
      }}
      className="btn-primario mt-4 w-full"
      aria-label={`Agregar ${producto.nombre} al carrito`}
    >
      {agregado ? <IconoCheck className="size-5" /> : <IconoMas />}
      <span aria-live="polite">
        {agregado ? "¡Agregado!" : lleno ? "Máximo alcanzado" : enCarrito ? `Agregar (${enCarrito} en carrito)` : "Agregar"}
      </span>
    </button>
  );
}
