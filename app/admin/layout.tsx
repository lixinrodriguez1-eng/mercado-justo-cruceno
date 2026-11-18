// Layout base de todo /admin (login incluido).
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s · Admin Café Chiquitano" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-crema-100">{children}</div>;
}
