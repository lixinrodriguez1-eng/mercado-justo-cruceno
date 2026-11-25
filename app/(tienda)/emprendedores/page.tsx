// Listado de emprendedores aprobados
import type { Metadata } from "next";
import { Suspense } from "react";
import { EsqueletoTarjetas } from "@/components/Esqueletos";
import { TarjetaEmprendedor } from "@/components/TarjetaEmprendedor";
import { obtenerEmprendedores } from "@/lib/datos";

export const metadata: Metadata = {
  title: "Emprendedores",
  description: "Conoce a los microemprendedores de los barrios periurbanos de Santa Cruz y sus historias.",
};

export default function EmprendedoresPage() {
  return (
    <div className="contenedor py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-sm font-extrabold tracking-wider text-acento-600 uppercase">Quiénes producen</p>
        <h1 className="mt-1 text-4xl font-bold sm:text-5xl">Emprendedores</h1>
        <p className="mt-3 text-lg text-cafe-600">
          Familias y artesanos de Plan 3000, Villa 1ro de Mayo, Pampa de la Isla, Los Lotes y otros barrios. Cada perfil
          fue revisado por la plataforma.
        </p>
      </header>
      <div className="mt-8">
        <Suspense fallback={<EsqueletoTarjetas cantidad={6} />}>
          <Lista />
        </Suspense>
      </div>
    </div>
  );
}

async function Lista() {
  const emprendedores = await obtenerEmprendedores();
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {emprendedores.map((e, i) => (
        <TarjetaEmprendedor key={e.id} emprendedor={e} prioridad={i === 0 ? "alta" : "diferida"} />
      ))}
    </div>
  );
}
