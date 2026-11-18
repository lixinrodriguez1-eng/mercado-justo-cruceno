// Verificación de sesión para las rutas API del administrador.
// Cada ruta /api/admin/* llama a `exigirAdmin()` al inicio: aunque proxy.ts
// ya protege las páginas, la API se valida por sí misma (defensa en profundidad).
import { cookies } from "next/headers";
import { ErrorApi } from "./api";
import { COOKIE_ADMIN, tokenValido } from "./auth";

export async function exigirAdmin(): Promise<void> {
  const token = (await cookies()).get(COOKIE_ADMIN)?.value;
  if (!(await tokenValido(token))) throw new ErrorApi(401, "No autorizado. Inicia sesión como administrador.");
}
