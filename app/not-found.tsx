// Página 404 personalizada
import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="contenedor flex min-h-[70dvh] flex-col items-center justify-center py-16 text-center">
      <p className="font-titulo text-7xl font-bold text-acento-500">404</p>
      <h1 className="mt-4 text-3xl font-bold">No encontramos esta página</h1>
      <p className="mt-2 max-w-md text-cafe-600">
        La página, el emprendedor o el pedido que buscas no existe o ya no está disponible.
      </p>
      <Link href="/" className="btn-primario mt-6">
        Volver al inicio
      </Link>
    </main>
  );
}
