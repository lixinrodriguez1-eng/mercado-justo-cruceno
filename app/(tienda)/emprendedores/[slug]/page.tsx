// =============================================================
// Página pública de un emprendedor: /emprendedores/<slug>
// Historia, barrio, rubro, contacto directo por WhatsApp y sus productos.
// =============================================================
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EsqueletoTarjetas } from "@/components/Esqueletos";
import { IconoMensaje, IconoUbicacion } from "@/components/Iconos";
import { ImagenProducto } from "@/components/ImagenProducto";
import { iniciales } from "@/components/TarjetaEmprendedor";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { obtenerEmprendedorPublico, obtenerProductos } from "@/lib/datos";
import { COMISION_PORCENTAJE, enlaceWhatsApp } from "@/lib/negocio";

// El título se define con <title> dentro de la página (React 19 lo sube al
// <head>), porque depende del emprendedor leído de MySQL.
export const metadata: Metadata = {
  description: "Historia y productos de un microemprendedor de Santa Cruz.",
};

export default function EmprendedorPage({ params }: PageProps<"/emprendedores/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="contenedor py-14">
          <EsqueletoTarjetas cantidad={4} />
        </div>
      }
    >
      <Perfil params={params} />
    </Suspense>
  );
}

async function Perfil({ params }: { params: PageProps<"/emprendedores/[slug]">["params"] }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
  const emprendedor = await obtenerEmprendedorPublico(slug);
  if (!emprendedor) notFound();
  const productos = await obtenerProductos({ publicos: true, emprendedorId: emprendedor.id });

  return (
    <>
      <title>{`${emprendedor.emprendimiento} · Mercado Justo Cruceño`}</title>
      <section className="bg-cafe-900 text-crema-100">
        <div className="contenedor grid items-center gap-8 py-12 md:grid-cols-[1fr_380px] md:py-16">
          <div>
            <p className="text-sm font-bold">
              <Link href="/emprendedores" className="underline-offset-4 hover:underline">
                Emprendedores
              </Link>{" "}
              / {emprendedor.rubro.nombre}
            </p>
            <h1 className="mt-3 text-4xl font-bold text-crema-50 sm:text-5xl">{emprendedor.emprendimiento}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-semibold">
              <span>{emprendedor.nombre}</span>
              <span className="inline-flex items-center gap-1">
                <IconoUbicacion className="size-4 text-acento-400" /> {emprendedor.barrio.nombre} (
                {emprendedor.barrio.zona})
              </span>
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={enlaceWhatsApp(
                  emprendedor.whatsapp,
                  `Hola ${emprendedor.emprendimiento}, los encontré en Mercado Justo Cruceño.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn bg-exito px-6 text-white hover:bg-exito/90"
              >
                <IconoMensaje /> Escribir por WhatsApp
              </a>
              <Link
                href={`/catalogo?emprendedor=${emprendedor.slug}`}
                className="btn border-2 border-crema-100/70 px-6 text-crema-50 hover:bg-crema-50 hover:text-cafe-900"
              >
                Ver en el catálogo
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-cafe-800">
            {emprendedor.foto ? (
              <ImagenProducto
                src={emprendedor.foto}
                alt={`Productos de ${emprendedor.emprendimiento}`}
                sizes="(min-width: 768px) 380px, 92vw"
                prioridad="alta"
              />
            ) : (
              <span className="grid h-full place-items-center font-titulo text-7xl font-bold">
                {iniciales(emprendedor.emprendimiento)}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="contenedor grid gap-8 py-12 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="titulo-historia">
          <h2 id="titulo-historia" className="text-3xl font-bold">
            Nuestra historia
          </h2>
          <div className="mt-4 space-y-4 text-lg leading-relaxed text-cafe-700">
            {emprendedor.historia
              .split("\n")
              .filter(Boolean)
              .map((parrafo, i) => (
                <p key={i}>{parrafo}</p>
              ))}
          </div>
        </section>
        <aside className="tarjeta h-fit p-6" aria-labelledby="titulo-justo">
          <h2 id="titulo-justo" className="text-xl font-bold">
            Comercio justo
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-cafe-700">
            <li>✔ Precio fijado por {emprendedor.nombre.split(" ")[0]}.</li>
            <li>✔ Comisión de la plataforma: {COMISION_PORCENTAJE} %.</li>
            <li>✔ Pago directo por QR o en efectivo al recibir.</li>
            <li>✔ Perfil verificado por la administración.</li>
          </ul>
        </aside>
      </div>

      <section className="contenedor" aria-labelledby="titulo-productos">
        <h2 id="titulo-productos" className="mb-6 text-3xl font-bold">
          Productos ({productos.length})
        </h2>
        {productos.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {productos.map((p) => (
              <TarjetaProducto key={p.id} producto={p} mostrarEmprendedor={false} />
            ))}
          </div>
        ) : (
          <p className="tarjeta p-8 text-center text-cafe-600">
            Este emprendedor aún no publicó productos disponibles.
          </p>
        )}
      </section>
    </>
  );
}
