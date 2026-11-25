// Página del carrito + formulario de pedido.
import type { Metadata } from "next";
import { Checkout } from "@/components/carrito/Checkout";

export const metadata: Metadata = {
  title: "Tu carrito",
  description: "Revisa tu carrito y confirma tu pedido. Cada emprendedor recibe su parte y el pago directo.",
};

export default function CarritoPage() {
  return (
    <div className="contenedor py-10 sm:py-14">
      <p className="text-sm font-extrabold tracking-wider text-acento-600 uppercase">Casi listo</p>
      <h1 className="mt-1 text-4xl font-bold sm:text-5xl">Tu carrito</h1>
      <Checkout />
    </div>
  );
}
