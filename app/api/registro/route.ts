// POST /api/registro  →  un microempresario crea su cuenta y su perfil (pública)
//
// El perfil queda "pendiente" (aprobado = false): no aparece en la tienda
// hasta que el administrador de la plataforma lo revise y apruebe.
// Mientras tanto ya puede entrar a su panel y cargar sus productos.
import { NextResponse } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { hashearContrasena } from "@/lib/contrasena";
import { crearSlug } from "@/lib/negocio";
import { prisma } from "@/lib/prisma";
import { guardarSesion } from "@/lib/sesion";
import { validarRegistro } from "@/lib/validacion";

export async function POST(request: Request) {
  try {
    const validacion = validarRegistro(await leerJson(request));
    if (!validacion.ok) throw new ErrorApi(422, "Revisa los datos del registro.", validacion.errores);
    const { email, password, nombre, rubroId, barrioId, ...perfil } = validacion.datos;

    // Rubro y barrio deben existir (no se confía en el id que manda el navegador)
    const [rubro, barrio, existente] = await Promise.all([
      prisma.rubro.findUnique({ where: { id: rubroId } }),
      prisma.barrio.findUnique({ where: { id: barrioId } }),
      prisma.usuario.findUnique({ where: { email }, select: { id: true } }),
    ]);
    const errores: Record<string, string> = {};
    if (!rubro) errores.rubroId = "Selecciona un rubro de la lista.";
    if (!barrio) errores.barrioId = "Selecciona un barrio de la lista.";
    if (existente) errores.email = "Ya existe una cuenta con ese correo. Inicia sesión.";
    if (Object.keys(errores).length) throw new ErrorApi(422, "Revisa los datos del registro.", errores);

    // Slug único para la URL pública: "cafe-chiquitano", "cafe-chiquitano-2"...
    const base = crearSlug(perfil.emprendimiento) || "emprendimiento";
    const usados = new Set(
      (await prisma.emprendedor.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })).map(
        (e) => e.slug,
      ),
    );
    let slug = base;
    for (let n = 2; usados.has(slug); n++) slug = `${base}-${n}`;

    const usuario = await prisma.usuario.create({
      data: {
        email,
        nombre,
        passwordHash: await hashearContrasena(password),
        rol: "EMPRENDEDOR",
        emprendedor: { create: { ...perfil, nombre, slug, rubroId, barrioId, aprobado: false } },
      },
    });

    await guardarSesion(usuario.id, "EMPRENDEDOR");
    return NextResponse.json({ ok: true, destino: "/panel" }, { status: 201 });
  } catch (error) {
    return manejarError(error);
  }
}
