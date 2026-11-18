// Página del menú: el servidor trae productos y categorías desde MySQL
// y el componente cliente <MenuInteractivo> filtra y busca sin recargar.
import type { Metadata } from "next";
import { Suspense } from "react";
import { EsqueletoTarjetas } from "@/components/Esqueletos";
import { MenuInteractivo } from "@/components/MenuInteractivo";
import { obtenerCategorias, obtenerProductos } from "@/lib/datos";

export const metadata: Metadata = {
  title: "Menú",
  description: "Cafés de especialidad, postres y salados. Filtra por categoría, busca y arma tu pedido.",
};

export default function MenuPage() {
  return (
    <div className="contenedor py-10 sm:py-14">
      <header className="max-w-2xl">
        <p className="text-sm font-extrabold tracking-wider text-acento-600 uppercase">Nuestro menú</p>
        <h1 className="mt-1 text-4xl font-bold sm:text-5xl">Elige, agrega y disfruta</h1>
        <p className="mt-3 text-lg text-cafe-600">
          Todo se prepara al momento. Agrega productos al carrito y confirma tu pedido en un minuto.
        </p>
      </header>

      <Suspense fallback={<div className="mt-8"><EsqueletoTarjetas cantidad={8} /></div>}>
        <MenuDatos />
      </Suspense>
    </div>
  );
}

async function MenuDatos() {
  // Ambas consultas se hacen en paralelo
  const [productos, categorias] = await Promise.all([
    obtenerProductos({ soloDisponibles: true }),
    obtenerCategorias(),
  ]);
  return <MenuInteractivo productos={productos} categorias={categorias} />;
}
