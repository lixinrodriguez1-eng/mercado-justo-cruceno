// Registro de emprendedores: la solicitud queda pendiente hasta que el
// administrador de la plataforma la apruebe.
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EsqueletoLista } from "@/components/Esqueletos";
import { FormularioEmprendedor } from "@/components/FormularioEmprendedor";
import { obtenerBarrios, obtenerRubros } from "@/lib/datos";
import { COMISION_PORCENTAJE } from "@/lib/negocio";

export const metadata: Metadata = {
  title: "Registra tu emprendimiento",
  description: "Vende tus productos en Mercado Justo Cruceño sin comisión. Registro gratuito para microemprendedores.",
};

export default function RegistroPage() {
  return (
    <div className="contenedor grid gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_320px]">
      <div>
        <p className="text-sm font-extrabold tracking-wider text-acento-600 uppercase">Vende aquí</p>
        <h1 className="mt-1 text-4xl font-bold sm:text-5xl">Registra tu emprendimiento</h1>
        <p className="mt-3 max-w-2xl text-lg text-cafe-600">
          Es gratis. Completa tus datos y cuenta tu historia; la administración revisa tu solicitud y, al aprobarla, tus
          productos aparecen en el catálogo.
        </p>
        <div className="tarjeta mt-8 p-5 sm:p-8">
          <Suspense fallback={<EsqueletoLista filas={4} />}>
            <Formulario />
          </Suspense>
        </div>
        <p className="mt-4 text-sm text-cafe-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/ingresar" className="font-bold text-acento-600 underline-offset-2 hover:underline">
            Ingresa a tu panel
          </Link>
        </p>
      </div>

      <aside className="tarjeta h-fit p-6" aria-labelledby="titulo-beneficios">
        <h2 id="titulo-beneficios" className="text-xl font-bold">
          Lo que obtienes
        </h2>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed text-cafe-700">
          <li>✔ Tu propia página con tu historia y tus productos.</li>
          <li>✔ Pedidos ordenados en tu panel, desde cualquier celular.</li>
          <li>✔ Comisión de la plataforma: {COMISION_PORCENTAJE} %. Cobras directo por QR o efectivo.</li>
          <li>✔ Clientes de toda Santa Cruz, no solo de tu barrio.</li>
        </ul>
      </aside>
    </div>
  );
}

async function Formulario() {
  const [rubros, barrios] = await Promise.all([obtenerRubros(), obtenerBarrios()]);
  return <FormularioEmprendedor modo="registro" rubros={rubros} barrios={barrios} />;
}
