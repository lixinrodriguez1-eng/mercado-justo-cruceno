"use client";
// =============================================================
// Estado global del carrito.
// El carrito vive en el navegador (localStorage) mientras el cliente
// elige; recién al confirmar el pedido se guarda en MySQL vía /api/pedidos.
//
// Se usa useSyncExternalStore: la forma recomendada por React para leer
// un almacenamiento externo (localStorage) sin errores de hidratación.
// Además sincroniza el carrito entre pestañas abiertas.
// =============================================================
import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import type { ItemCarrito, ProductoDTO } from "@/lib/tipos";

const CLAVE_STORAGE = "cafe-chiquitano:carrito";
export const MAX_POR_PRODUCTO = 20; // mismo límite que valida el servidor
const VACIO: ItemCarrito[] = [];

/** Revisa que lo guardado en localStorage tenga la forma correcta */
function leerGuardado(): ItemCarrito[] {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_STORAGE) ?? "[]");
    if (!Array.isArray(datos)) return VACIO;
    return datos.filter(
      (i): i is ItemCarrito =>
        Number.isInteger(i?.productoId) &&
        typeof i?.nombre === "string" &&
        typeof i?.precio === "number" &&
        typeof i?.imagen === "string" &&
        Number.isInteger(i?.cantidad) &&
        i.cantidad > 0,
    );
  } catch {
    return VACIO; // modo privado o datos corruptos: carrito vacío
  }
}

// ---------- "Store" externo muy simple ----------
let itemsActuales: ItemCarrito[] | null = null;
const oyentes = new Set<() => void>();

const emitir = () => oyentes.forEach((avisar) => avisar());

function obtenerItems(): ItemCarrito[] {
  if (itemsActuales === null) itemsActuales = leerGuardado();
  return itemsActuales;
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  // Si el carrito cambia en otra pestaña, lo recargamos aquí
  const alCambiarStorage = (e: StorageEvent) => {
    if (e.key === CLAVE_STORAGE) {
      itemsActuales = leerGuardado();
      emitir();
    }
  };
  window.addEventListener("storage", alCambiarStorage);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", alCambiarStorage);
  };
}

function modificar(cambio: (items: ItemCarrito[]) => ItemCarrito[]) {
  itemsActuales = cambio(obtenerItems());
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(itemsActuales));
  } catch {
    /* almacenamiento no disponible: el carrito funciona solo en memoria */
  }
  emitir();
}

// ---------- Acciones ----------
const acciones = {
  agregar(producto: ProductoDTO) {
    modificar((items) => {
      const existente = items.find((i) => i.productoId === producto.id);
      if (existente)
        return items.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: Math.min(i.cantidad + 1, MAX_POR_PRODUCTO) } : i,
        );
      return [
        ...items,
        { productoId: producto.id, nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen, cantidad: 1 },
      ];
    });
  },
  cambiarCantidad(productoId: number, cantidad: number) {
    modificar((items) =>
      cantidad <= 0
        ? items.filter((i) => i.productoId !== productoId)
        : items.map((i) => (i.productoId === productoId ? { ...i, cantidad: Math.min(cantidad, MAX_POR_PRODUCTO) } : i)),
    );
  },
  quitar(productoId: number) {
    modificar((items) => items.filter((i) => i.productoId !== productoId));
  },
  vaciar() {
    modificar(() => VACIO);
  },
};

// ---------- Contexto de React ----------
type ValorCarrito = typeof acciones & {
  items: ItemCarrito[];
  cantidadTotal: number;
  subtotal: number;
  listo: boolean; // true cuando ya se leyó localStorage (evita parpadeos)
};

const CarritoContext = createContext<ValorCarrito | null>(null);
const sinSuscripcion = () => () => {};

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  // En el servidor no existe localStorage: allí el carrito siempre está vacío
  const items = useSyncExternalStore(suscribir, obtenerItems, () => VACIO);
  // false durante el render del servidor / hidratación, true después
  const listo = useSyncExternalStore(sinSuscripcion, () => true, () => false);

  const valor = useMemo<ValorCarrito>(
    () => ({
      ...acciones,
      items,
      listo,
      cantidadTotal: items.reduce((s, i) => s + i.cantidad, 0),
      subtotal: items.reduce((s, i) => s + i.precio * i.cantidad, 0),
    }),
    [items, listo],
  );

  return <CarritoContext.Provider value={valor}>{children}</CarritoContext.Provider>;
}

export function useCarrito() {
  const ctx = useContext(CarritoContext);
  if (!ctx) throw new Error("useCarrito debe usarse dentro de <CarritoProvider>");
  return ctx;
}
