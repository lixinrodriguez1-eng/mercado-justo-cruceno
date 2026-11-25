// Inicio de sesión para emprendedores y administración
import type { Metadata } from "next";
import Link from "next/link";
import { FormularioLogin } from "@/components/FormularioLogin";
import { IconoTienda } from "@/components/Iconos";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false },
};

export default function IngresarPage() {
  return (
    <div className="grid place-items-center px-4 py-14">
      <div className="tarjeta w-full max-w-sm p-6 sm:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-cafe-800 text-crema-100">
          <IconoTienda className="size-7" />
        </span>
        <h1 className="mt-4 text-center text-2xl font-bold">Ingresar a mi panel</h1>
        <p className="mt-1 text-center text-sm text-cafe-600">Emprendedores y administración</p>
        <FormularioLogin />
        <p className="mt-5 text-center text-sm text-cafe-600">
          ¿Aún no vendes aquí?{" "}
          <Link href="/registro" className="font-bold text-acento-600 underline-offset-2 hover:underline">
            Registra tu emprendimiento
          </Link>
        </p>
      </div>
    </div>
  );
}
