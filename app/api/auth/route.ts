// /api/auth
//   POST   → inicia sesión del administrador  { "password": "..." }
//   DELETE → cierra la sesión
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { COOKIE_ADMIN, DURACION_SESION_SEG, contrasenaCorrecta, crearToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cuerpo = await leerJson(request);
    const password =
      typeof cuerpo === "object" && cuerpo && "password" in cuerpo ? String(cuerpo.password) : "";
    if (!password || !contrasenaCorrecta(password)) throw new ErrorApi(401, "Contraseña incorrecta.");

    (await cookies()).set(COOKIE_ADMIN, await crearToken(), {
      httpOnly: true, // JavaScript del navegador no puede leerla
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: DURACION_SESION_SEG,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return manejarError(error);
  }
}

export async function DELETE() {
  (await cookies()).delete(COOKIE_ADMIN);
  return NextResponse.json({ ok: true });
}
