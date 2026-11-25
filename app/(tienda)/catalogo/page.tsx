// Catálogo general: el servidor trae productos, rubros, barrios y emprendedores
// desde MySQL y el componente cliente <CatalogoInteractivo> filtra sin recargar.
// Los filtros iniciales pueden venir en la URL: /catalogo?rubro=artesania&barrio=el-bajio
import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogoInteractivo, type FiltrosCatalogo } from "@/components/CatalogoInteractivo";
import { EsqueletoTarjetas } from "@/components/Esqueletos";
import { obtenerBarrios, obtenerEmprendedores, obtenerProductos, obtenerRubros } from "@/lib/datos";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Productos de microemprendedores de los barrios periurbanos de Santa Cruz. Filtra por rubro, barrio o emprendedor y compra directo.",
};

export default function CatalogoPage({ searchParams }: PageProps<"/catalogo">) {
  return (
    <div className="contenedor py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-sm font-extrabold tracking-wider text-acento-600 uppercase">Catálogo</p>
        <h1 className="mt-1 text-4xl font-bold sm:text-5xl">Hecho en nuestros barrios</h1>
        <p className="mt-3 text-lg text-cafe-600">
          Cada compra llega completa a quien la produjo. Filtra por rubro, barrio o emprendedor.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="mt-8">
            <EsqueletoTarjetas cantidad={8} />
          </div>
        }
      >
        <CatalogoDatos searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const texto = (v: string | string[] | undefined, max = 80) => (typeof v === "string" ? v.slice(0, max) : "");

async function CatalogoDatos({ searchParams }: { searchParams: PageProps<"/catalogo">["searchParams"] }) {
  const params = await searchParams;
  const inicial: FiltrosCatalogo = {
    rubro: texto(params.rubro),
    barrio: texto(params.barrio),
    emprendedor: texto(params.emprendedor),
    q: texto(params.q, 100),
  };
  // Las cuatro consultas se hacen en paralelo
  const [productos, rubros, barrios, emprendedores] = await Promise.all([
    obtenerProductos({ publicos: true }),
    obtenerRubros(),
    obtenerBarrios(),
    obtenerEmprendedores(),
  ]);
  return (
    <CatalogoInteractivo
      productos={productos}
      rubros={rubros}
      barrios={barrios}
      emprendedores={emprendedores.map((e) => ({ slug: e.slug, nombre: e.emprendimiento }))}
      inicial={inicial}
    />
  );
}
