// Inicio de sesión del administrador
import type { Metadata } from "next";
import { FormularioLogin } from "@/components/admin/FormularioLogin";
import { IconoTaza } from "@/components/Iconos";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="tarjeta w-full max-w-sm p-6 sm:p-8">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-cafe-800 text-crema-100">
          <IconoTaza className="size-7" />
        </span>
        <h1 className="mt-4 text-center text-2xl font-bold">Panel de administración</h1>
        <p className="mt-1 text-center text-sm text-cafe-600">Café Chiquitano</p>
        <FormularioLogin />
      </div>
    </main>
  );
}
