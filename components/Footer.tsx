// Pie de página: propósito de la plataforma, enlaces y ODS.
import Link from "next/link";
import { COMISION_PORCENTAJE, PLATAFORMA } from "@/lib/negocio";

export function Footer() {
  return (
    <footer className="mt-20 bg-cafe-900 text-cafe-100">
      <div className="contenedor grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-titulo text-2xl font-bold text-crema-50">{PLATAFORMA.nombre}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed">
            {PLATAFORMA.lema}. Comisión de la plataforma: {COMISION_PORCENTAJE} %. El pago va directo a cada productor.
          </p>
          <p className="mt-4 max-w-md text-sm">
            Alineada con los ODS 4 (educación de calidad), 8 (trabajo decente), 9 (innovación) y 10 (reducción de las
            desigualdades).
          </p>
        </div>

        <div>
          <h2 className="font-titulo text-lg font-bold text-crema-50">Compra</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link href="/catalogo" className="hover:text-crema-50 hover:underline">
                Catálogo
              </Link>
            </li>
            <li>
              <Link href="/emprendedores" className="hover:text-crema-50 hover:underline">
                Emprendedores
              </Link>
            </li>
            <li>
              <Link href="/carrito" className="hover:text-crema-50 hover:underline">
                Mi carrito
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-titulo text-lg font-bold text-crema-50">Vende</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link href="/registro" className="hover:text-crema-50 hover:underline">
                Registra tu emprendimiento
              </Link>
            </li>
            <li>
              <Link href="/ingresar" className="hover:text-crema-50 hover:underline">
                Ingresar a mi panel
              </Link>
            </li>
            <li>
              <Link href="/#como-funciona" className="hover:text-crema-50 hover:underline">
                Cómo funciona
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cafe-800">
        <div className="contenedor py-4 text-xs text-cafe-300">
          <p>
            © 2026 {PLATAFORMA.nombre} · Proyecto Socioformativo Integrador UPDS – Diseño Web II. Plataforma, personas y
            emprendimientos ficticios con fines académicos.
          </p>
        </div>
      </div>
    </footer>
  );
}
