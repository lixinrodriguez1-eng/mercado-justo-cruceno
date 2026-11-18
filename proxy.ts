// =============================================================
// Proxy (antes "middleware") - protege las páginas del panel /admin.
// Si no hay una sesión válida, redirige a /admin/login.
// Las rutas /api/admin/* además verifican la sesión por su cuenta.
// =============================================================
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ADMIN, tokenValido } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sesionValida = await tokenValido(request.cookies.get(COOKIE_ADMIN)?.value);

  // Ya logueado e intenta ver el login → lo enviamos al panel
  if (pathname === "/admin/login") {
    return sesionValida ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next();
  }

  if (!sesionValida) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("desde", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
