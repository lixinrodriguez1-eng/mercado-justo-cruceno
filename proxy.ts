// =============================================================
// Proxy (antes "middleware") - control de acceso por ROL y anti-CSRF.
//  - /admin/*  → solo ADMIN de la plataforma
//  - /panel/*  → solo EMPRENDEDOR
//  - /ingresar → si ya hay sesión, lleva al panel que corresponde
//  - /api/*    → las peticiones que modifican datos (POST, PUT, PATCH,
//                DELETE) deben venir de este mismo sitio (cabecera Origin).
//                Así otra página no puede usar la cookie de sesión de la
//                víctima para enviar formularios ocultos (CSRF, OWASP A01).
// Las rutas /api/admin/* y /api/panel/* además verifican la sesión y el rol
// por su cuenta contra la base de datos (lib/sesion.ts).
// =============================================================
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, INICIO_POR_ROL, leerToken } from "@/lib/auth";

const METODOS_SEGUROS = ["GET", "HEAD", "OPTIONS"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (METODOS_SEGUROS.includes(request.method)) return NextResponse.next();
    const origen = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    let mismoSitio = false;
    try {
      mismoSitio = !!origen && new URL(origen).host === host;
    } catch {
      /* Origin mal formado */
    }
    if (!mismoSitio) return NextResponse.json({ error: "Petición rechazada: origen no permitido." }, { status: 403 });
    return NextResponse.next();
  }

  const sesion = await leerToken(request.cookies.get(COOKIE_SESION)?.value);

  if (pathname === "/ingresar") {
    return sesion ? NextResponse.redirect(new URL(INICIO_POR_ROL[sesion.rol], request.url)) : NextResponse.next();
  }

  const rolRequerido = pathname.startsWith("/admin") ? "ADMIN" : "EMPRENDEDOR";
  if (!sesion || sesion.rol !== rolRequerido) {
    // Con sesión de otro rol: a su propio panel. Sin sesión: al inicio de sesión.
    if (sesion) return NextResponse.redirect(new URL(INICIO_POR_ROL[sesion.rol], request.url));
    const login = new URL("/ingresar", request.url);
    login.searchParams.set("desde", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/panel", "/panel/:path*", "/ingresar", "/api/:path*"],
};
