// Layout de la tienda (modo cliente): navbar, carrito global y pie de página.
import { CarritoProvider } from "@/components/carrito/CarritoProvider";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <CarritoProvider>
      {/* Enlace para saltar la navegación (accesibilidad con teclado) */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-cafe-900 focus:px-4 focus:py-2 focus:text-crema-50"
      >
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido">{children}</main>
      <Footer />
    </CarritoProvider>
  );
}
