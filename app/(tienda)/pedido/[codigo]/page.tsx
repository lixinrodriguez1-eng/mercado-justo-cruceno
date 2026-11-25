// =============================================================
// Confirmación de la compra: /pedido/<codigo>
// El código es aleatorio (cuid), así solo quien hizo la compra conoce la URL.
// Muestra un bloque por emprendedor: su pedido, el desglose de comercio justo
// (cuánto recibe el productor), su QR de pago referencial y su WhatsApp.
// =============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BotonActualizar } from "@/components/BotonActualizar";
import { EsqueletoLista } from "@/components/Esqueletos";
import { EstadoBadge, ProgresoPedido } from "@/components/EstadoBadge";
import { IconoCheck, IconoMensaje } from "@/components/Iconos";
import { obtenerCompraPorCodigo } from "@/lib/datos";
import { enlaceWhatsApp, formatearFecha, formatearPrecio, numeroPedido } from "@/lib/negocio";
import { qrPagoReferencial } from "@/lib/qr";
import type { CompraDTO, PedidoDTO } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Compra confirmada",
  robots: { index: false }, // página privada: que no aparezca en buscadores
};

export default function PedidoPage({ params }: PageProps<"/pedido/[codigo]">) {
  return (
    <div className="contenedor max-w-4xl py-10 sm:py-14">
      <Suspense fallback={<EsqueletoLista filas={3} />}>
        <Confirmacion params={params} />
      </Suspense>
    </div>
  );
}

async function Confirmacion({ params }: { params: PageProps<"/pedido/[codigo]">["params"] }) {
  const { codigo } = await params;
  if (!/^[a-z0-9]{10,30}$/.test(codigo)) notFound();

  const compra = await obtenerCompraPorCodigo(codigo);
  if (!compra) notFound();

  return (
    <article className="space-y-6">
      <header className="tarjeta bg-cafe-800 px-6 py-8 text-center text-crema-50 sm:px-10">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-exito text-white">
          <IconoCheck className="size-9" />
        </span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">¡Gracias, {compra.cliente.split(" ")[0]}!</h1>
        <p className="mt-2 text-crema-100">
          {compra.pedidos.length === 1
            ? "Tu pedido ya llegó al panel del emprendedor."
            : `Tu compra se repartió en ${compra.pedidos.length} pedidos: cada emprendedor ya recibió el suyo.`}
        </p>
        <dl className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-crema-50/10 px-4 py-2 ring-1 ring-crema-50/25">
            <dt className="text-xs font-bold tracking-wider text-crema-100 uppercase">Total</dt>
            <dd className="font-titulo text-2xl font-bold tabular-nums">{formatearPrecio(compra.total)}</dd>
          </div>
          <div className="rounded-2xl bg-crema-50/10 px-4 py-2 ring-1 ring-crema-50/25">
            <dt className="text-xs font-bold tracking-wider text-crema-100 uppercase">Fecha</dt>
            <dd className="font-bold">{formatearFecha(compra.fecha)}</dd>
          </div>
        </dl>
      </header>

      {compra.pedidos.map((p) => (
        <BloquePedido key={p.id} pedido={p} compra={compra} />
      ))}

      <div className="flex flex-col gap-3 sm:flex-row">
        <BotonActualizar />
        <Link href="/catalogo" className="btn-primario sm:ml-auto">
          Seguir comprando
        </Link>
      </div>
    </article>
  );
}

async function BloquePedido({ pedido, compra }: { pedido: PedidoDTO; compra: CompraDTO }) {
  const numero = numeroPedido(pedido.id);
  const qr = await qrPagoReferencial({
    emprendimiento: pedido.emprendedor.emprendimiento,
    pedido: numero,
    monto: pedido.subtotal,
    comision: pedido.comision,
  });
  const mensaje = `Hola ${pedido.emprendedor.emprendimiento}, soy ${compra.cliente}. Hice el pedido #${numero} en Mercado Justo Cruceño (${formatearPrecio(pedido.subtotal)}). ¿Coordinamos la entrega?`;

  return (
    <section className="tarjeta overflow-hidden" aria-labelledby={`titulo-pedido-${pedido.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-crema-200 bg-crema-50 px-6 py-4">
        <div>
          <h2 id={`titulo-pedido-${pedido.id}`} className="text-xl font-bold">
            {pedido.emprendedor.emprendimiento}
          </h2>
          <p className="text-sm text-cafe-600">
            Pedido #{numero} · {pedido.emprendedor.barrio.nombre}
          </p>
        </div>
        <EstadoBadge estado={pedido.estado} />
      </div>

      <div className="grid gap-6 p-6 md:grid-cols-[1fr_220px]">
        <div>
          <ProgresoPedido estado={pedido.estado} />
          <ul className="mt-5 divide-y divide-crema-200">
            {pedido.detalles.map((d) => (
              <li key={d.id} className="flex justify-between gap-4 py-2.5">
                <span>
                  <span className="font-bold tabular-nums">{d.cantidad}×</span> {d.nombreProducto}
                </span>
                <span className="font-semibold tabular-nums">{formatearPrecio(d.subtotal)}</span>
              </li>
            ))}
          </ul>
          {/* Desglose de comercio justo */}
          <dl className="mt-3 space-y-1 border-t-2 border-cafe-800 pt-3 text-sm">
            <div className="flex justify-between text-lg font-extrabold">
              <dt>A pagar</dt>
              <dd className="tabular-nums">{formatearPrecio(pedido.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-cafe-600">
              <dt>Comisión de la plataforma</dt>
              <dd className="tabular-nums">{formatearPrecio(pedido.comision)}</dd>
            </div>
            <div className="flex justify-between font-bold text-exito">
              <dt>Recibe el productor</dt>
              <dd className="tabular-nums">{formatearPrecio(pedido.montoProductor)}</dd>
            </div>
          </dl>
          <a
            href={enlaceWhatsApp(pedido.emprendedor.whatsapp, mensaje)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn mt-5 bg-exito text-white hover:bg-exito/90"
          >
            <IconoMensaje /> Coordinar entrega por WhatsApp
          </a>
        </div>

        <figure className="rounded-2xl border border-crema-200 p-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- QR en data: URI generado en el servidor */}
          <img
            src={qr}
            alt={`QR de pago referencial del pedido ${numero}`}
            width={180}
            height={180}
            className="mx-auto size-44"
          />
          <figcaption className="mt-2 text-xs leading-snug text-cafe-600">
            <strong className="block text-cafe-800">Pago directo al productor</strong>
            QR referencial de demostración (no es un QR bancario).
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
