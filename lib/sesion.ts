// =============================================================
// Verificación de sesión y de ROL (control de acceso, OWASP A01:2025).
// proxy.ts ya protege las páginas, pero cada ruta API y cada página del
// panel vuelve a validar por su cuenta (defensa en profundidad):
//  1. la firma del token (nadie puede cambiar su rol en la cookie),
//  2. que el usuario siga existiendo y esté activo en la base de datos
//     (si el admin suspende una cuenta, la sesión deja de servir al instante).
// =============================================================
import { cookies } from "next/headers";
import { ErrorApi } from "./api";
import { COOKIE_SESION, DURACION_SESION_SEG, crearToken, leerToken } from "./auth";
import { prisma } from "./prisma";
import type { Rol, SesionDTO } from "./tipos";

export async function obtenerSesion(): Promise<SesionDTO | null> {
  const datos = await leerToken((await cookies()).get(COOKIE_SESION)?.value);
  if (!datos) return null;
  const usuario = await prisma.usuario.findUnique({
    where: { id: datos.usuarioId },
    include: { emprendedor: { select: { id: true, slug: true, emprendimiento: true, aprobado: true } } },
  });
  // El rol se toma de la BASE DE DATOS, no solo del token
  if (!usuario || !usuario.activo || usuario.rol !== datos.rol) return null;
  return {
    usuarioId: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    emprendedor: usuario.emprendedor,
  };
}

export async function exigirAdmin(): Promise<SesionDTO> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new ErrorApi(401, "No autorizado. Inicia sesión.");
  if (sesion.rol !== "ADMIN") throw new ErrorApi(403, "Solo el administrador de la plataforma puede hacer esto.");
  return sesion;
}

/** Devuelve la sesión con el id del emprendedor, que se usa para filtrar TODO lo que toca */
export async function exigirEmprendedor(): Promise<SesionDTO & { emprendedor: NonNullable<SesionDTO["emprendedor"]> }> {
  const sesion = await obtenerSesion();
  if (!sesion) throw new ErrorApi(401, "No autorizado. Inicia sesión.");
  if (sesion.rol !== "EMPRENDEDOR" || !sesion.emprendedor)
    throw new ErrorApi(403, "Esta sección es solo para emprendedores.");
  return sesion as SesionDTO & { emprendedor: NonNullable<SesionDTO["emprendedor"]> };
}

/** Cookie de sesión: httpOnly (JavaScript no la lee), SameSite=Lax y Secure en producción */
export async function guardarSesion(usuarioId: number, rol: Rol) {
  (await cookies()).set(COOKIE_SESION, await crearToken(usuarioId, rol), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_SEG,
  });
}
