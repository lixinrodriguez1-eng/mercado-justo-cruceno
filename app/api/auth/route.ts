// /api/auth
//   POST   → inicia sesión  { "email": "...", "password": "..." }
//   DELETE → cierra la sesión
//
// Seguridad (OWASP A07:2025 Authentication Failures):
//  - contraseñas verificadas con bcrypt (lib/contrasena.ts)
//  - mismo mensaje y tiempo de respuesta si el correo no existe
//    (no se puede averiguar qué correos están registrados)
//  - 5 intentos fallidos bloquean la cuenta 15 minutos (se guarda en MySQL,
//    así funciona aunque Vercel use varias instancias del servidor)
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { COOKIE_SESION, INICIO_POR_ROL } from "@/lib/auth";
import { MAX_INTENTOS, MINUTOS_BLOQUEO, obtenerHashFicticio, verificarContrasena } from "@/lib/contrasena";
import { prisma } from "@/lib/prisma";
import { guardarSesion } from "@/lib/sesion";
import { validarCredenciales } from "@/lib/validacion";

const MENSAJE_GENERICO = "Correo o contraseña incorrectos.";

export async function POST(request: Request) {
  try {
    const validacion = validarCredenciales(await leerJson(request));
    if (!validacion.ok) throw new ErrorApi(401, MENSAJE_GENERICO);
    const { email, password } = validacion.datos;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      await verificarContrasena(password, obtenerHashFicticio()); // mismo tiempo de respuesta
      throw new ErrorApi(401, MENSAJE_GENERICO);
    }

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      const minutos = Math.ceil((usuario.bloqueadoHasta.getTime() - Date.now()) / 60000);
      throw new ErrorApi(429, `Demasiados intentos fallidos. Espera ${minutos} min e inténtalo de nuevo.`);
    }

    if (!(await verificarContrasena(password, usuario.passwordHash))) {
      const intentos = usuario.intentosFallidos + 1;
      const bloquear = intentos >= MAX_INTENTOS;
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          intentosFallidos: bloquear ? 0 : intentos,
          bloqueadoHasta: bloquear ? new Date(Date.now() + MINUTOS_BLOQUEO * 60000) : null,
        },
      });
      if (bloquear)
        throw new ErrorApi(429, `Demasiados intentos fallidos. La cuenta se bloqueó ${MINUTOS_BLOQUEO} minutos.`);
      throw new ErrorApi(401, MENSAJE_GENERICO);
    }

    if (!usuario.activo) throw new ErrorApi(403, "Tu cuenta está suspendida. Comunícate con la administración.");

    if (usuario.intentosFallidos || usuario.bloqueadoHasta)
      await prisma.usuario.update({ where: { id: usuario.id }, data: { intentosFallidos: 0, bloqueadoHasta: null } });

    await guardarSesion(usuario.id, usuario.rol);
    return NextResponse.json({ ok: true, rol: usuario.rol, destino: INICIO_POR_ROL[usuario.rol] });
  } catch (error) {
    return manejarError(error);
  }
}

export async function DELETE() {
  (await cookies()).delete(COOKIE_SESION);
  return NextResponse.json({ ok: true });
}
