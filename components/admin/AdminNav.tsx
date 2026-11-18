"use client";
// Barra superior del panel de administración
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { pedirApi } from "@/lib/cliente-api";
import { IconoTaza } from "../Iconos";

const SECCIONES = [
  { href: "/admin", texto: "Productos" },
  { href: "/admin/pedidos", texto: "Pedidos" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function salir() {
    await pedirApi("/api/auth", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh(); // descarta las páginas del panel guardadas en memoria
  }

  return (
    <header className="sticky top-0 z-40 bg-cafe-900 text-crema-100">
      <div className="contenedor flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
        <Link href="/admin" className="flex items-center gap-2">
          <IconoTaza className="size-6 text-acento-400" />
          <span className="font-titulo text-lg font-bold">Admin · Café Chiquitano</span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/" className="rounded-full px-3 py-2 font-bold hover:bg-cafe-800">
            Ver tienda
          </Link>
          <button type="button" onClick={salir} className="cursor-pointer rounded-full px-3 py-2 font-bold hover:bg-cafe-800">
            Cerrar sesión
          </button>
        </div>
      </div>
      <nav className="contenedor flex gap-1" aria-label="Secciones del panel">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            aria-current={pathname === s.href ? "page" : undefined}
            className="rounded-t-xl px-5 py-2.5 text-sm font-bold text-crema-100 transition-colors duration-200 hover:bg-cafe-800 aria-[current=page]:bg-crema-100 aria-[current=page]:text-cafe-900"
          >
            {s.texto}
          </Link>
        ))}
      </nav>
    </header>
  );
}
