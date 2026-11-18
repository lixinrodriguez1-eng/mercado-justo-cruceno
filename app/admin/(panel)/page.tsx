// /admin → gestión de productos (CRUD)
import type { Metadata } from "next";
import { Suspense } from "react";
import { GestorProductos } from "@/components/admin/GestorProductos";
import { EsqueletoLista } from "@/components/Esqueletos";
import { obtenerCategorias, obtenerProductos } from "@/lib/datos";

export const metadata: Metadata = { title: "Productos" };

export default function AdminProductosPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Productos</h1>
      <p className="mt-1 text-cafe-600">Crea, edita, elimina y controla la disponibilidad del menú.</p>
      <Suspense fallback={<div className="mt-6"><EsqueletoLista filas={6} /></div>}>
        <Datos />
      </Suspense>
    </>
  );
}

async function Datos() {
  const [productos, categorias] = await Promise.all([obtenerProductos(), obtenerCategorias()]);
  return <GestorProductos productosIniciales={productos} categorias={categorias} />;
}
