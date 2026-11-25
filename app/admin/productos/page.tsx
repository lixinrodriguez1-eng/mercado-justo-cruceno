// /admin/productos → moderación: ocultar o mostrar productos de cualquier emprendedor
import type { Metadata } from "next";
import { Suspense } from "react";
import { GestorProductos } from "@/components/admin/GestorProductos";
import { EsqueletoLista } from "@/components/Esqueletos";
import { obtenerProductos } from "@/lib/datos";
import { exigirAdminPagina } from "@/lib/sesion-pagina";

export const metadata: Metadata = { title: "Productos" };

export default function AdminProductosPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Moderación de productos</h1>
      <p className="mt-1 text-cafe-600">
        Oculta un producto si no cumple las normas. El contenido solo lo edita su emprendedor.
      </p>
      <Suspense
        fallback={
          <div className="mt-6">
            <EsqueletoLista filas={6} />
          </div>
        }
      >
        <Datos />
      </Suspense>
    </>
  );
}

async function Datos() {
  await exigirAdminPagina();
  return <GestorProductos productosIniciales={await obtenerProductos()} modo="admin" />;
}
