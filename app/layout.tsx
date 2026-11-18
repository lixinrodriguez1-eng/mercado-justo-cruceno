// Layout raíz: idioma, tipografías y metadatos comunes a todo el sitio.
import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import "./globals.css";

// Tipografía con personalidad para títulos (serif cálida, estilo artesanal)
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

// Tipografía legible para textos y formularios
const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Café Chiquitano · Cafetería artesanal en Santa Cruz",
    template: "%s · Café Chiquitano",
  },
  description:
    "Cafetería artesanal en Santa Cruz de la Sierra. Café de origen boliviano, postres y salados. Haz tu pedido en línea y recógelo sin filas.",
};

export const viewport: Viewport = {
  themeColor: "#3d2618",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${nunito.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
