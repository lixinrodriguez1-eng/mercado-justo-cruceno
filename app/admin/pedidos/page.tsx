// /admin/pedidos → supervisión de los pedidos de todos los emprendedores
import type { Metadata } from "next";
import { Suspense } from "react";
import { GestorPedidos } from "@/components/admin/GestorPedidos";
import { EsqueletoLista } from "@/components/Esqueletos";
import { obtenerPedidos } from "@/lib/datos";
import { exigirAdminPagina } from "@/lib/sesion-pagina";

export const metadata: Metadata = { title: "Pedidos" };

export default function AdminPedidosPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Pedidos de la plataforma</h1>
      <p className="mt-1 text-cafe-600">
        Vista de supervisión. Cada emprendedor actualiza el estado de sus pedidos desde su panel.
      </p>
      <Suspense
        fallback={
          <div className="mt-6">
            <EsqueletoLista filas={4} />
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
  return <GestorPedidos pedidosIniciales={await obtenerPedidos()} modo="admin" />;
}
