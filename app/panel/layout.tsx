// Layout del panel del EMPRENDEDOR (proxy.ts exige rol EMPRENDEDOR)
import type { Metadata } from "next";
import { PanelNav } from "@/components/admin/PanelNav";

export const metadata: Metadata = {
  title: { default: "Mi panel", template: "%s · Mi panel · Mercado Justo" },
  robots: { index: false, follow: false },
};

const SECCIONES = [
  { href: "/panel", texto: "Mis productos" },
  { href: "/panel/pedidos", texto: "Mis pedidos" },
  { href: "/panel/perfil", texto: "Mi perfil" },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-crema-100">
      <PanelNav titulo="Mi panel · Mercado Justo" inicio="/panel" secciones={SECCIONES} />
      <main className="contenedor py-8">{children}</main>
    </div>
  );
}
