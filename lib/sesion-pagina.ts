// Verificación de sesión para las PÁGINAS de los paneles (componentes de servidor).
// proxy.ts ya redirige, pero aquí se vuelve a validar contra la base de datos
// antes de leer cualquier dato privado (defensa en profundidad).
import { redirect } from "next/navigation";
import { obtenerSesion } from "./sesion";

export async function exigirAdminPagina() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "ADMIN") redirect("/api/auth/salir");
  return sesion;
}

export async function exigirEmprendedorPagina() {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.rol !== "EMPRENDEDOR" || !sesion.emprendedor) redirect("/api/auth/salir");
  return { ...sesion, emprendedor: sesion.emprendedor };
}
