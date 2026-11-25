// Layout del panel de ADMINISTRACIÓN de la plataforma (proxy.ts exige rol ADMIN)
import type { Metadata } from "next";
import { PanelNav } from "@/components/admin/PanelNav";

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s · Admin Mercado Justo" },
  robots: { index: false, follow: false },
};

const SECCIONES = [
  { href: "/admin", texto: "Emprendedores" },
  { href: "/admin/pedidos", texto: "Pedidos" },
  { href: "/admin/productos", texto: "Productos" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-crema-100">
      <PanelNav titulo="Admin · Mercado Justo" inicio="/admin" secciones={SECCIONES} />
      <main className="contenedor py-8">{children}</main>
    </div>
  );
}
