// =============================================================
// Confirmación del pedido: /pedido/<codigo>
// El código es aleatorio (cuid), así solo quien hizo el pedido conoce la URL.
// =============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BotonActualizar } from "@/components/BotonActualizar";
import { EsqueletoLista } from "@/components/Esqueletos";
import { EstadoBadge, ProgresoPedido } from "@/components/EstadoBadge";
import { IconoCheck } from "@/components/Iconos";
import { obtenerPedidoPorCodigo } from "@/lib/datos";
import { NEGOCIO, formatearFecha, formatearPrecio } from "@/lib/negocio";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false }, // página privada: que no aparezca en buscadores
};

export default function PedidoPage({ params }: PageProps<"/pedido/[codigo]">) {
  return (
    <div className="contenedor max-w-3xl py-10 sm:py-14">
      <Suspense fallback={<EsqueletoLista filas={3} />}>
        <Confirmacion params={params} />
      </Suspense>
    </div>
  );
}

async function Confirmacion({ params }: { params: PageProps<"/pedido/[codigo]">["params"] }) {
  const { codigo } = await params;
  if (!/^[a-z0-9]{10,30}$/.test(codigo)) notFound();

  const pedido = await obtenerPedidoPorCodigo(codigo);
  if (!pedido) notFound();

  const numero = String(pedido.id).padStart(5, "0");
  const mensajeWhatsApp = encodeURIComponent(`Hola, quiero consultar por mi pedido #${numero} a nombre de ${pedido.cliente}.`);

  return (
    <article className="tarjeta overflow-hidden">
      <header className="bg-cafe-800 px-6 py-8 text-center text-crema-50 sm:px-10">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-exito text-white">
          <IconoCheck className="size-9" />
        </span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">¡Gracias, {pedido.cliente.split(" ")[0]}!</h1>
        <p className="mt-2 text-crema-100">Recibimos tu pedido y ya está en nuestra lista.</p>
        <p className="mt-5 inline-block rounded-2xl bg-crema-50/10 px-5 py-2 ring-1 ring-crema-50/25">
          <span className="block text-xs font-bold tracking-wider text-crema-100 uppercase">Número de pedido</span>
          <span className="font-titulo text-3xl font-bold tabular-nums">#{numero}</span>
        </p>
      </header>

      <div className="space-y-8 p-6 sm:p-10">
        <section aria-labelledby="titulo-estado">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 id="titulo-estado" className="text-xl font-bold">
              Estado
            </h2>
            <EstadoBadge estado={pedido.estado} />
          </div>
          <ProgresoPedido estado={pedido.estado} />
        </section>

        <section aria-labelledby="titulo-detalle">
          <h2 id="titulo-detalle" className="text-xl font-bold">
            Detalle
          </h2>
          <ul className="mt-3 divide-y divide-crema-200">
            {pedido.detalles.map((d) => (
              <li key={d.id} className="flex justify-between gap-4 py-3">
                <span>
                  <span className="font-bold tabular-nums">{d.cantidad}×</span> {d.nombreProducto}
                </span>
                <span className="font-semibold tabular-nums">{formatearPrecio(d.subtotal)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex justify-between border-t-2 border-cafe-800 pt-3 text-xl font-extrabold">
            <span>Total a pagar</span>
            <span className="tabular-nums">{formatearPrecio(pedido.total)}</span>
          </p>
        </section>

        <dl className="grid gap-4 rounded-2xl bg-crema-100 p-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-bold text-cafe-600">Fecha</dt>
            <dd>{formatearFecha(pedido.fecha)}</dd>
          </div>
          <div>
            <dt className="font-bold text-cafe-600">Celular de contacto</dt>
            <dd>{pedido.telefono}</dd>
          </div>
          {pedido.nota && (
            <div className="sm:col-span-2">
              <dt className="font-bold text-cafe-600">Indicaciones</dt>
              <dd>{pedido.nota}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="font-bold text-cafe-600">Retiro</dt>
            <dd>
              {NEGOCIO.direccion}. Paga en caja con efectivo o QR.
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-3 sm:flex-row">
          <BotonActualizar />
          <a
            href={`https://wa.me/${NEGOCIO.whatsapp}?text=${mensajeWhatsApp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secundario"
          >
            Consultar por WhatsApp
          </a>
          <Link href="/menu" className="btn-primario sm:ml-auto">
            Volver al menú
          </Link>
        </div>
      </div>
    </article>
  );
}
