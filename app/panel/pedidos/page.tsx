// /panel/pedidos → pedidos que recibió el emprendedor con sesión
import type { Metadata } from "next";
import { Suspense } from "react";
import { GestorPedidos } from "@/components/admin/GestorPedidos";
import { EsqueletoLista } from "@/components/Esqueletos";
import { obtenerPedidos } from "@/lib/datos";
import { exigirEmprendedorPagina } from "@/lib/sesion-pagina";

export const metadata: Metadata = { title: "Mis pedidos" };

export default function PanelPedidosPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Mis pedidos</h1>
      <p className="mt-1 text-cafe-600">
        Los pedidos nuevos aparecen automáticamente. Escribe al cliente por WhatsApp para coordinar la entrega y el
        pago.
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
  const { emprendedor } = await exigirEmprendedorPagina();
  return (
    <GestorPedidos pedidosIniciales={await obtenerPedidos({ emprendedorId: emprendedor.id })} modo="emprendedor" />
  );
}
