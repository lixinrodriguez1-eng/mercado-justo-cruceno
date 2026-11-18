// Etiqueta de color para el estado de un pedido (se usa en cliente y admin).
import { ETIQUETA_ESTADO } from "@/lib/negocio";
import type { EstadoPedido } from "@/lib/tipos";

const ESTILOS: Record<EstadoPedido, string> = {
  PENDIENTE: "bg-amber-100 text-amber-900 ring-amber-300",
  PREPARANDO: "bg-sky-100 text-sky-900 ring-sky-300",
  ENTREGADO: "bg-emerald-100 text-emerald-900 ring-emerald-300",
};

export function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${ESTILOS[estado]}`}>
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}

/** Línea de progreso del pedido: Pendiente → Preparando → Entregado */
export function ProgresoPedido({ estado }: { estado: EstadoPedido }) {
  const pasos: EstadoPedido[] = ["PENDIENTE", "PREPARANDO", "ENTREGADO"];
  const actual = pasos.indexOf(estado);
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Progreso del pedido">
      {pasos.map((paso, i) => (
        <li key={paso} aria-current={i === actual ? "step" : undefined}>
          <div className={`h-2 rounded-full ${i <= actual ? "bg-acento-500" : "bg-crema-200"}`} />
          <p className={`mt-2 text-xs font-bold sm:text-sm ${i <= actual ? "text-cafe-900" : "text-cafe-500"}`}>
            {ETIQUETA_ESTADO[paso]}
          </p>
        </li>
      ))}
    </ol>
  );
}
