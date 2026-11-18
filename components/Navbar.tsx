"use client";
// Barra de navegación "sticky" con menú hamburguesa en móviles.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useCarrito } from "./carrito/CarritoProvider";
import { IconoCarrito, IconoCerrar, IconoMenu, IconoTaza } from "./Iconos";

const ENLACES = [
  { href: "/", texto: "Inicio" },
  { href: "/menu", texto: "Menú" },
  { href: "/#horarios", texto: "Horarios" },
  { href: "/#compromiso", texto: "Compromiso" },
];

export function Navbar() {
  const [abierto, setAbierto] = useState(false);
  const { cantidadTotal, listo } = useCarrito();

  // Cierra el menú móvil con la tecla Escape
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto]);

  const cerrar = () => setAbierto(false);

  return (
    <header className="sticky top-0 z-40 border-b border-crema-200 bg-crema-50">
      <nav className="contenedor flex h-16 items-center justify-between gap-4" aria-label="Principal">
        <Link href="/" onClick={cerrar} className="flex items-center gap-2 text-cafe-800">
          <span className="grid size-9 place-items-center rounded-full bg-cafe-800 text-crema-100">
            <IconoTaza className="size-5" />
          </span>
          <span className="font-titulo text-xl font-bold tracking-tight">Café Chiquitano</span>
        </Link>

        {/* Enlaces en escritorio */}
        <ul className="hidden items-center gap-1 md:flex">
          <EnlacesConRutaActual variante="escritorio" />
        </ul>

        <div className="flex items-center gap-1">
          <Link
            href="/carrito"
            onClick={cerrar}
            className="relative grid size-11 place-items-center rounded-full text-cafe-800 transition-colors duration-200 hover:bg-crema-200"
            aria-label={`Ver carrito, ${cantidadTotal} producto${cantidadTotal === 1 ? "" : "s"}`}
          >
            <IconoCarrito />
            {listo && cantidadTotal > 0 && (
              <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-acento-500 px-1 text-xs font-bold text-white">
                {cantidadTotal}
              </span>
            )}
          </Link>

          {/* Botón hamburguesa (solo móvil) */}
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="grid size-11 place-items-center rounded-full text-cafe-800 transition-colors duration-200 hover:bg-crema-200 md:hidden"
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          >
            {abierto ? <IconoCerrar /> : <IconoMenu />}
          </button>
        </div>
      </nav>

      {/* Menú desplegable en móvil (se anima con grid-rows para respetar reduced-motion) */}
      <div
        id="menu-movil"
        className={`grid transition-[grid-template-rows] duration-200 md:hidden ${abierto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <ul className="contenedor overflow-hidden" inert={!abierto}>
          <EnlacesConRutaActual variante="movil" onNavegar={cerrar} />
        </ul>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------
// Enlaces de navegación. Leer la ruta actual (usePathname) depende de
// la URL, así que va dentro de <Suspense>: mientras tanto se muestran los
// mismos enlaces sin resaltar y la página no se bloquea (Cache Components).
// ---------------------------------------------------------------
interface PropsEnlaces {
  variante: "escritorio" | "movil";
  onNavegar?: () => void;
}

function EnlacesConRutaActual(props: PropsEnlaces) {
  return (
    <Suspense fallback={<ListaEnlaces {...props} rutaActual={null} />}>
      <EnlacesActivos {...props} />
    </Suspense>
  );
}

function EnlacesActivos(props: PropsEnlaces) {
  return <ListaEnlaces {...props} rutaActual={usePathname()} />;
}

const ESTILOS_ENLACE = {
  escritorio:
    "rounded-full px-4 py-2 text-sm font-bold text-cafe-700 transition-colors duration-200 hover:bg-crema-200 aria-[current=page]:bg-cafe-800 aria-[current=page]:text-crema-50",
  movil: "block py-3.5 text-base font-bold text-cafe-800 aria-[current=page]:text-acento-500",
};

function ListaEnlaces({ variante, onNavegar, rutaActual }: PropsEnlaces & { rutaActual: string | null }) {
  return ENLACES.map((e) => (
    <li key={e.href} className={variante === "movil" ? "border-t border-crema-200 first:border-t-0" : undefined}>
      <Link
        href={e.href}
        onClick={onNavegar}
        aria-current={e.href === rutaActual ? "page" : undefined}
        className={ESTILOS_ENLACE[variante]}
      >
        {e.texto}
      </Link>
    </li>
  ));
}
