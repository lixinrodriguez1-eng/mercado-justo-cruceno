// /admin/pedidos → lista de pedidos con cambio de estado
import type { Metadata } from "next";
import { Suspense } from "react";
import { GestorPedidos } from "@/components/admin/GestorPedidos";
import { EsqueletoLista } from "@/components/Esqueletos";
import { obtenerPedidos } from "@/lib/datos";

export const metadata: Metadata = { title: "Pedidos" };

export default function AdminPedidosPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Pedidos</h1>
      <p className="mt-1 text-cafe-600">Los pedidos nuevos aparecen automáticamente. Cambia su estado a medida que avanzan.</p>
      <Suspense fallback={<div className="mt-6"><EsqueletoLista filas={4} /></div>}>
        <Datos />
      </Suspense>
    </>
  );
}

async function Datos() {
  return <GestorPedidos pedidosIniciales={await obtenerPedidos()} />;
}
