// Layout del panel (todas las páginas de /admin excepto el login).
import { AdminNav } from "@/components/admin/AdminNav";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminNav />
      <main className="contenedor py-8">{children}</main>
    </>
  );
}
