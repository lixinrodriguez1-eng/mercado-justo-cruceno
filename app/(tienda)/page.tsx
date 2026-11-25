// =============================================================
// Página de inicio de Mercado Justo Cruceño.
// Todo es estático (se pre-renderiza) excepto las cifras, los emprendedores
// y los productos destacados, que se leen de MySQL y llegan en streaming
// dentro de <Suspense> (Cache Components).
// =============================================================
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { EsqueletoTarjetas } from "@/components/Esqueletos";
import {
  IconoCelular,
  IconoGrafico,
  IconoIgualdad,
  IconoLibro,
  IconoManos,
  IconoMensaje,
  IconoTienda,
} from "@/components/Iconos";
import { TarjetaEmprendedor } from "@/components/TarjetaEmprendedor";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { obtenerEmprendedores, obtenerProductos, obtenerResumenPlataforma } from "@/lib/datos";
import { COMISION_PORCENTAJE } from "@/lib/negocio";

const IMAGEN_HERO = "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1600&q=70&auto=format&fit=crop";

export default function InicioPage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<div className="h-28 bg-cafe-800" aria-hidden />}>
        <Cifras />
      </Suspense>
      <ComoFunciona />

      <section className="contenedor mt-20" aria-labelledby="titulo-emprendedores">
        <EncabezadoSeccion
          id="titulo-emprendedores"
          antetitulo="Conoce a quién le compras"
          titulo="Emprendedores de nuestros barrios"
          accion={{ href: "/emprendedores", texto: "Ver todos" }}
        />
        <Suspense fallback={<EsqueletoTarjetas cantidad={3} />}>
          <Emprendedores />
        </Suspense>
      </section>

      <section className="contenedor mt-20" aria-labelledby="titulo-destacados">
        <EncabezadoSeccion
          id="titulo-destacados"
          antetitulo="Hecho a mano, cerca de ti"
          titulo="Productos destacados"
          accion={{ href: "/catalogo", texto: "Ver catálogo completo" }}
        />
        <Suspense fallback={<EsqueletoTarjetas />}>
          <Destacados />
        </Suspense>
      </section>

      <Ods />
      <LlamadoRegistro />
    </>
  );
}

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-cafe-900">
      <Image
        src={IMAGEN_HERO}
        alt="Puesto de mercado con verduras y frutas frescas de productores locales"
        fill
        // Es la imagen más grande (LCP): se descarga primero y sin lazy-load
        loading="eager"
        fetchPriority="high"
        sizes="100vw"
        quality={60}
        className="-z-10 object-cover"
      />
      {/* Degradado para asegurar contraste del texto sobre la foto */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cafe-900/95 via-cafe-900/85 to-cafe-900/50" />

      <div className="contenedor py-20 sm:py-28 lg:py-32">
        <p className="inline-flex rounded-full bg-crema-50/15 px-3 py-1 text-sm font-bold text-crema-100 ring-1 ring-crema-50/25">
          Comercio justo · Santa Cruz de la Sierra
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.1] font-bold text-crema-50 sm:text-5xl lg:text-6xl">
          Compra directo a quienes producen <span className="text-acento-400 italic">en tu ciudad</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-crema-100">
          Café, pan, verduras agroecológicas, artesanía y cosmética natural de microemprendedores de los barrios
          periurbanos. Sin intermediarios: el {100 - COMISION_PORCENTAJE} % del precio llega al productor.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/catalogo" className="btn-primario px-7 text-base">
            Ver el catálogo
          </Link>
          <Link
            href="/registro"
            className="btn border-2 border-crema-100/70 px-7 text-base text-crema-50 hover:bg-crema-50 hover:text-cafe-900"
          >
            Registra tu emprendimiento
          </Link>
        </div>
      </div>
    </section>
  );
}

// Cifras reales de la base de datos (impacto de la plataforma)
async function Cifras() {
  const r = await obtenerResumenPlataforma();
  const cifras = [
    { n: String(r.emprendedores), t: "emprendedores" },
    { n: String(r.productos), t: "productos" },
    { n: String(r.barrios), t: "barrios periurbanos" },
    { n: `${COMISION_PORCENTAJE} %`, t: "comisión" },
  ];
  return (
    <section aria-label="La plataforma en cifras" className="bg-cafe-800 text-crema-50">
      <dl className="contenedor grid grid-cols-2 gap-4 py-6 sm:grid-cols-4">
        {cifras.map((c) => (
          <div key={c.t} className="text-center">
            <dt className="order-2 text-sm text-crema-100">{c.t}</dt>
            <dd className="font-titulo text-3xl font-bold text-acento-400">{c.n}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ComoFunciona() {
  const pasos = [
    {
      icono: <IconoTienda />,
      titulo: "1. Elige",
      texto: "Filtra por rubro o por barrio y conoce la historia de cada emprendedor antes de comprar.",
    },
    {
      icono: <IconoCelular />,
      titulo: "2. Pide",
      texto: "Tu pedido llega directo al panel del productor. Si compras a varios, cada uno recibe su parte.",
    },
    {
      icono: <IconoMensaje className="size-6" />,
      titulo: "3. Paga directo",
      texto:
        "Coordinas la entrega por WhatsApp y pagas al productor por QR o en efectivo. La plataforma no cobra comisión.",
    },
  ];
  return (
    <section id="como-funciona" className="mt-20 scroll-mt-20 bg-crema-100 py-16" aria-labelledby="titulo-como">
      <div className="contenedor">
        <EncabezadoSeccion id="titulo-como" antetitulo="Comercio justo, simple" titulo="¿Cómo funciona?" />
        <ol className="grid gap-5 md:grid-cols-3">
          {pasos.map((p) => (
            <li key={p.titulo} className="tarjeta p-6">
              <span className="grid size-12 place-items-center rounded-2xl bg-cafe-800 text-crema-100">{p.icono}</span>
              <h3 className="mt-4 text-xl font-bold">{p.titulo}</h3>
              <p className="mt-2 leading-relaxed text-cafe-600">{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

async function Emprendedores() {
  const emprendedores = (await obtenerEmprendedores()).slice(0, 3);
  if (!emprendedores.length) return <p className="text-cafe-600">Pronto se sumarán los primeros emprendedores.</p>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {emprendedores.map((e) => (
        <TarjetaEmprendedor key={e.id} emprendedor={e} />
      ))}
    </div>
  );
}

// Componente de servidor: consulta MySQL en cada visita
async function Destacados() {
  const productos = await obtenerProductos({ publicos: true, soloDestacados: true });
  if (productos.length === 0)
    return <p className="text-cafe-600">Pronto tendremos nuevos destacados. ¡Mira el catálogo completo!</p>;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {productos.slice(0, 8).map((p) => (
        <TarjetaProducto key={p.id} producto={p} />
      ))}
    </div>
  );
}

function Ods() {
  const ods = [
    {
      n: "ODS 4",
      titulo: "Educación de calidad",
      icono: <IconoLibro />,
      texto: "Guías y un panel sencillo para que cada emprendedor aprenda a vender en línea por su cuenta.",
    },
    {
      n: "ODS 8",
      titulo: "Trabajo decente",
      icono: <IconoManos />,
      texto: "Precio justo fijado por el productor y pago directo, sin comisiones ni intermediarios.",
    },
    {
      n: "ODS 9",
      titulo: "Innovación",
      icono: <IconoGrafico />,
      texto: "Una tienda web rápida incluso con 3G y celulares de gama baja, abierta las 24 horas.",
    },
    {
      n: "ODS 10",
      titulo: "Menos desigualdad",
      icono: <IconoIgualdad />,
      texto: "Los barrios periurbanos acceden al mismo mercado digital que el centro de la ciudad.",
    },
  ];
  return (
    <section id="ods" className="contenedor mt-20 scroll-mt-20" aria-labelledby="titulo-ods">
      <EncabezadoSeccion id="titulo-ods" antetitulo="Nuestro compromiso" titulo="Objetivos de Desarrollo Sostenible" />
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ods.map((o) => (
          <li key={o.n} className="tarjeta p-6">
            <div className="flex items-center justify-between">
              <span className="grid size-12 place-items-center rounded-2xl bg-cafe-800 text-crema-100">{o.icono}</span>
              <span className="rounded-full bg-acento-500/10 px-3 py-1 text-xs font-extrabold text-acento-600">
                {o.n}
              </span>
            </div>
            <h3 className="mt-4 text-xl font-bold">{o.titulo}</h3>
            <p className="mt-2 leading-relaxed text-cafe-600">{o.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LlamadoRegistro() {
  return (
    <section className="contenedor mt-20" aria-labelledby="titulo-registro">
      <div className="tarjeta flex flex-col items-start gap-5 bg-cafe-800 p-8 text-crema-100 sm:p-12 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <h2 id="titulo-registro" className="text-3xl font-bold text-crema-50">
            ¿Tienes un emprendimiento en tu barrio?
          </h2>
          <p className="mt-2 leading-relaxed">
            Regístrate gratis, cuenta tu historia y publica tus productos. Revisamos tu solicitud y en poco tiempo
            apareces en el catálogo.
          </p>
        </div>
        <Link href="/registro" className="btn-primario shrink-0 px-7 text-base">
          Quiero vender aquí
        </Link>
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
