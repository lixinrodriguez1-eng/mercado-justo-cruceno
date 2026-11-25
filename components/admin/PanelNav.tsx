"use client";
// Barra superior de los paneles (administración y emprendedor)
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { pedirApi } from "@/lib/cliente-api";
import { IconoTienda } from "../Iconos";

interface Props {
  titulo: string;
  inicio: string;
  secciones: { href: string; texto: string }[];
}

export function PanelNav({ titulo, inicio, secciones }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function salir() {
    await pedirApi("/api/auth", { method: "DELETE" });
    router.replace("/ingresar");
    router.refresh(); // descarta las páginas del panel guardadas en memoria
  }

  return (
    <header className="sticky top-0 z-40 bg-cafe-900 text-crema-100">
      <div className="contenedor flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
        <Link href={inicio} className="flex items-center gap-2">
          <IconoTienda className="size-6 text-acento-400" />
          <span className="font-titulo text-lg font-bold">{titulo}</span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          <Link href="/" className="rounded-full px-3 py-2 font-bold hover:bg-cafe-800">
            Ver tienda
          </Link>
          <button
            type="button"
            onClick={salir}
            className="cursor-pointer rounded-full px-3 py-2 font-bold hover:bg-cafe-800"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
      <nav className="contenedor flex gap-1 overflow-x-auto" aria-label="Secciones del panel">
        {secciones.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            aria-current={pathname === s.href ? "page" : undefined}
            className="shrink-0 rounded-t-xl px-5 py-2.5 text-sm font-bold text-crema-100 transition-colors duration-200 hover:bg-cafe-800 aria-[current=page]:bg-crema-100 aria-[current=page]:text-cafe-900"
          >
            {s.texto}
          </Link>
        ))}
      </nav>
    </header>
  );
}
