// Pie de página con datos de contacto, horarios y referencia a los ODS.
import Link from "next/link";
import { HORARIOS, NEGOCIO } from "@/lib/negocio";

export function Footer() {
  return (
    <footer className="mt-20 bg-cafe-900 text-cafe-100">
      <div className="contenedor grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-titulo text-2xl font-bold text-crema-50">{NEGOCIO.nombre}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed">{NEGOCIO.lema}.</p>
          <p className="mt-4 text-sm">
            Comprometidos con los ODS 8 (trabajo decente y crecimiento económico) y 9 (industria,
            innovación e infraestructura).
          </p>
        </div>

        <div>
          <h2 className="font-titulo text-lg font-bold text-crema-50">Visítanos</h2>
          <address className="mt-2 text-sm leading-relaxed not-italic">
            {NEGOCIO.direccion}
            <br />
            {NEGOCIO.ciudad}
            <br />
            Tel. {NEGOCIO.telefono}
          </address>
        </div>

        <div>
          <h2 className="font-titulo text-lg font-bold text-crema-50">Horarios</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {HORARIOS.map((h) => (
              <li key={h.dias}>
                {h.dias}: {h.horas}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-cafe-800">
        <div className="contenedor flex flex-col gap-2 py-4 text-xs text-cafe-300 sm:flex-row sm:justify-between">
          <p>© 2026 {NEGOCIO.nombre} · Proyecto académico UPDS – Diseño Web 2 (negocio ficticio)</p>
          <Link href="/admin" className="underline-offset-4 hover:text-crema-50 hover:underline">
            Panel de administración
          </Link>
        </div>
      </div>
    </footer>
  );
}
