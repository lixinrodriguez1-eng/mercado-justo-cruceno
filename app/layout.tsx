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
    default: "Mercado Justo Cruceño · Comercio justo de los barrios de Santa Cruz",
    template: "%s · Mercado Justo Cruceño",
  },
  description:
    "Plataforma de comercio justo: compra directo a microemprendedores de los barrios periurbanos de Santa Cruz de la Sierra. Sin intermediarios y con 0 % de comisión.",
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
