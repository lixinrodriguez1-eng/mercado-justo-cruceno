// GET /api/auth/salir  →  borra la cookie de sesión y vuelve a /ingresar.
// Lo usan las páginas de los paneles cuando la firma del token es válida pero
// la cuenta ya no lo es (suspendida o eliminada): sin borrar la cookie,
// proxy.ts y la página se redirigirían entre sí sin fin.
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION } from "@/lib/auth";

export function GET(request: NextRequest) {
  const respuesta = NextResponse.redirect(new URL("/ingresar", request.url));
  respuesta.cookies.delete(COOKIE_SESION);
  return respuesta;
}
