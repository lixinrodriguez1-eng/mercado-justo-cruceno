// /admin → impacto de la plataforma y aprobación de emprendedores
import type { Metadata } from "next";
import { Suspense } from "react";
import { GestorEmprendedores } from "@/components/admin/GestorEmprendedores";
import { EsqueletoLista } from "@/components/Esqueletos";
import { obtenerEmprendedores, obtenerResumenPlataforma } from "@/lib/datos";
import { formatearPrecio } from "@/lib/negocio";
import { exigirAdminPagina } from "@/lib/sesion-pagina";

export const metadata: Metadata = { title: "Emprendedores" };

export default function AdminInicioPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Emprendedores</h1>
      <p className="mt-1 text-cafe-600">
        Revisa las solicitudes nuevas y aprueba a quienes cumplen los principios de comercio justo.
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
  const [resumen, emprendedores] = await Promise.all([
    obtenerResumenPlataforma(),
    obtenerEmprendedores({ soloPublicos: false }),
  ]);
  const cifras = [
    { n: String(resumen.emprendedores), t: "Emprendedores activos" },
    { n: String(resumen.pendientes), t: "Solicitudes pendientes" },
    { n: String(resumen.pedidos), t: "Pedidos recibidos" },
    { n: formatearPrecio(resumen.montoProductores), t: "Pagado a productores" },
  ];
  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cifras.map((c) => (
          <div key={c.t} className="tarjeta p-4">
            <p className="font-titulo text-2xl font-bold tabular-nums sm:text-3xl">{c.n}</p>
            <p className="text-sm font-semibold text-cafe-600">{c.t}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-cafe-600">
        Comisiones cobradas por la plataforma: <strong>{formatearPrecio(resumen.comisiones)}</strong> (comercio justo: 0
        %).
      </p>
      <GestorEmprendedores iniciales={emprendedores} />
    </>
  );
}
