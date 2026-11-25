// /panel → productos del emprendedor con sesión (CRUD)
import type { Metadata } from "next";
import { Suspense } from "react";
import { AvisoAprobacion } from "@/components/admin/AvisoAprobacion";
import { GestorProductos } from "@/components/admin/GestorProductos";
import { EsqueletoLista } from "@/components/Esqueletos";
import { obtenerProductos } from "@/lib/datos";
import { exigirEmprendedorPagina } from "@/lib/sesion-pagina";

export const metadata: Metadata = { title: "Mis productos" };

export default function PanelProductosPage() {
  return (
    <Suspense fallback={<EsqueletoLista filas={6} />}>
      <Datos />
    </Suspense>
  );
}

async function Datos() {
  const { emprendedor } = await exigirEmprendedorPagina();
  // Solo los productos del emprendedor con sesión
  const productos = await obtenerProductos({ emprendedorId: emprendedor.id });
  return (
    <>
      <h1 className="text-3xl font-bold">Mis productos · {emprendedor.emprendimiento}</h1>
      <p className="mt-1 text-cafe-600">
        Crea, edita y marca como agotado lo que vendes. Tú fijas el precio y recibes el 100 %.
      </p>
      <AvisoAprobacion aprobado={emprendedor.aprobado} slug={emprendedor.slug} />
      <GestorProductos productosIniciales={productos} modo="emprendedor" />
    </>
  );
}
