// =============================================================
// Página de inicio: hero, productos destacados, compromiso ODS y horarios.
// Todo es estático (se pre-renderiza) excepto los destacados, que se leen
// de MySQL y llegan en streaming dentro de <Suspense>.
// =============================================================
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { EsqueletoTarjetas } from "@/components/Esqueletos";
import { EstadoAbierto } from "@/components/EstadoAbierto";
import { IconoCelular, IconoHoja, IconoManos, IconoReloj, IconoUbicacion } from "@/components/Iconos";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { obtenerProductos } from "@/lib/datos";
import { HORARIOS, NEGOCIO } from "@/lib/negocio";

const IMAGEN_HERO =
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1600&q=70&auto=format&fit=crop";

export default function InicioPage() {
  return (
    <>
      <Hero />

      <section className="contenedor mt-16" aria-labelledby="titulo-destacados">
        <EncabezadoSeccion
          id="titulo-destacados"
          antetitulo="Los favoritos de la casa"
          titulo="Productos destacados"
          accion={{ href: "/menu", texto: "Ver menú completo" }}
        />
        <Suspense fallback={<EsqueletoTarjetas />}>
          <Destacados />
        </Suspense>
      </section>

      <Compromiso />
      <Horarios />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-cafe-900">
      <Image
        src={IMAGEN_HERO}
        alt="Tazas de capuchino con arte latte sobre una mesa de madera"
        fill
        // Es la imagen más grande (LCP): se descarga primero y sin lazy-load
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        quality={60}
        className="-z-10 object-cover"
      />
      {/* Degradado para asegurar contraste del texto sobre la foto */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cafe-900/95 via-cafe-900/75 to-cafe-900/30" />

      <div className="contenedor py-20 sm:py-28 lg:py-36">
        <p className="inline-flex rounded-full bg-crema-50/15 px-3 py-1 text-sm font-bold text-crema-100 ring-1 ring-crema-50/25">
          Santa Cruz de la Sierra · desde 2026
        </p>
        <h1 className="mt-5 max-w-2xl text-4xl leading-[1.1] font-bold text-crema-50 sm:text-5xl lg:text-6xl">
          Café de origen boliviano, <span className="text-acento-400 italic">hecho a mano</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-crema-100">
          Granos de los Yungas, postres con frutas del oriente y salados recién horneados. Pide en línea
          y recoge tu pedido sin hacer fila.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/menu" className="btn-primario px-7 text-base">
            Ver el menú y pedir
          </Link>
          <Link
            href="/#horarios"
            className="btn border-2 border-crema-100/70 px-7 text-base text-crema-50 hover:bg-crema-50 hover:text-cafe-900"
          >
            Horarios y ubicación
          </Link>
        </div>
      </div>
    </section>
  );
}

// Componente de servidor: consulta MySQL en cada visita
async function Destacados() {
  const productos = await obtenerProductos({ soloDisponibles: true, soloDestacados: true });
  if (productos.length === 0)
    return <p className="text-cafe-600">Pronto tendremos nuevos destacados. ¡Mira el menú completo!</p>;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {productos.slice(0, 8).map((p) => (
        <TarjetaProducto key={p.id} producto={p} />
      ))}
    </div>
  );
}

function Compromiso() {
  const puntos = [
    {
      icono: <IconoManos />,
      titulo: "Trabajo decente",
      ods: "ODS 8",
      texto:
        "Baristas y reposteros cruceños con contrato formal, sueldo justo y capacitación continua en barismo.",
    },
    {
      icono: <IconoHoja />,
      titulo: "Comercio justo y local",
      ods: "ODS 8",
      texto:
        "Compramos café directamente a familias productoras de los Yungas y frutas a productores del oriente.",
    },
    {
      icono: <IconoCelular />,
      titulo: "Innovación digital",
      ods: "ODS 9",
      texto:
        "Pedidos en línea desde el celular: menos filas, menos desperdicio y un negocio local preparado para crecer.",
    },
  ];

  return (
    <section id="compromiso" className="mt-20 scroll-mt-20 bg-crema-100 py-16" aria-labelledby="titulo-compromiso">
      <div className="contenedor">
        <EncabezadoSeccion
          id="titulo-compromiso"
          antetitulo="Nuestro compromiso"
          titulo="Un café que también hace bien"
        />
        <ul className="grid gap-5 md:grid-cols-3">
          {puntos.map((p) => (
            <li key={p.titulo} className="tarjeta p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-2xl bg-cafe-800 text-crema-100">
                  {p.icono}
                </span>
                <span className="rounded-full bg-acento-500/10 px-3 py-1 text-xs font-extrabold text-acento-600">
                  {p.ods}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold">{p.titulo}</h3>
              <p className="mt-2 leading-relaxed text-cafe-600">{p.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Horarios() {
  return (
    <section id="horarios" className="contenedor mt-20 scroll-mt-20" aria-labelledby="titulo-horarios">
      <div className="tarjeta grid overflow-hidden md:grid-cols-2">
        <div className="p-6 sm:p-10">
          <p className="text-sm font-extrabold tracking-wider text-acento-600 uppercase">Te esperamos</p>
          <h2 id="titulo-horarios" className="mt-1 text-3xl font-bold">
            Horarios de atención
          </h2>
          <div className="mt-4">
            <EstadoAbierto />
          </div>
          <ul className="mt-6 divide-y divide-crema-200">
            {HORARIOS.map((h) => (
              <li key={h.dias} className="flex items-center justify-between gap-4 py-3">
                <span className="flex items-center gap-3 font-semibold text-cafe-800">
                  <IconoReloj className="size-5 text-cafe-500" />
                  {h.dias}
                </span>
                <span className="font-bold tabular-nums">{h.horas}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-center gap-4 bg-cafe-800 p-6 text-crema-100 sm:p-10">
          <IconoUbicacion className="size-8 text-acento-400" />
          <h3 className="text-2xl font-bold text-crema-50">¿Dónde estamos?</h3>
          <address className="leading-relaxed not-italic">
            {NEGOCIO.direccion}
            <br />
            {NEGOCIO.ciudad}
          </address>
          <p>
            Teléfono / WhatsApp: <strong className="text-crema-50">{NEGOCIO.telefono}</strong>
          </p>
          <Link href="/menu" className="btn-primario mt-2 self-start">
            Hacer un pedido
          </Link>
        </div>
      </div>
    </section>
  );
}

function EncabezadoSeccion({
  id,
  antetitulo,
  titulo,
  accion,
}: {
  id: string;
  antetitulo: string;
  titulo: string;
  accion?: { href: string; texto: string };
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-extrabold tracking-wider text-acento-600 uppercase">{antetitulo}</p>
        <h2 id={id} className="mt-1 text-3xl font-bold sm:text-4xl">
          {titulo}
        </h2>
      </div>
      {accion && (
        <Link href={accion.href} className="btn-secundario">
          {accion.texto}
        </Link>
      )}
    </div>
  );
}
