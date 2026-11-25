// /panel/perfil → el emprendedor edita su página pública
import type { Metadata } from "next";
import { Suspense } from "react";
import { AvisoAprobacion } from "@/components/admin/AvisoAprobacion";
import { EsqueletoLista } from "@/components/Esqueletos";
import { FormularioEmprendedor } from "@/components/FormularioEmprendedor";
import { obtenerBarrios, obtenerEmprendedorPorId, obtenerRubros } from "@/lib/datos";
import { exigirEmprendedorPagina } from "@/lib/sesion-pagina";

export const metadata: Metadata = { title: "Mi perfil" };

export default function PanelPerfilPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Mi perfil público</h1>
      <p className="mt-1 text-cafe-600">
        Esto es lo que ven tus clientes en tu página. Una buena historia genera confianza.
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
  const sesion = await exigirEmprendedorPagina();
  const [perfil, rubros, barrios] = await Promise.all([
    obtenerEmprendedorPorId(sesion.emprendedor.id),
    obtenerRubros(),
    obtenerBarrios(),
  ]);
  if (!perfil) return null;
  return (
    <>
      <AvisoAprobacion aprobado={perfil.aprobado} slug={perfil.slug} />
      <div className="tarjeta mt-6 p-5 sm:p-8">
        <FormularioEmprendedor modo="perfil" rubros={rubros} barrios={barrios} inicial={perfil} />
      </div>
    </>
  );
}
