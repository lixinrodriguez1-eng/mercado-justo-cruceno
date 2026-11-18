// /api/admin/productos/:id  (requiere sesión de administrador)
//   PUT    → reemplaza todos los datos del producto (formulario de edición)
//   PATCH  → cambia solo algunos campos (ej. { "disponible": false })
//   DELETE → elimina el producto (los pedidos antiguos conservan su detalle)
import { NextResponse, type NextRequest } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { aProductoDTO } from "@/lib/serializar";
import { exigirAdmin } from "@/lib/sesion";
import { idValido, validarProducto } from "@/lib/validacion";

type Contexto = RouteContext<"/api/admin/productos/[id]">;

async function obtenerId(ctx: Contexto): Promise<number> {
  const id = idValido((await ctx.params).id);
  if (!id) throw new ErrorApi(400, "Id de producto inválido.");
  return id;
}

async function actualizar(request: NextRequest, ctx: Contexto, parcial: boolean) {
  try {
    await exigirAdmin();
    const id = await obtenerId(ctx);
    const validacion = validarProducto(await leerJson(request), parcial);
    if (!validacion.ok) throw new ErrorApi(422, "Revisa los datos del producto.", validacion.errores);

    const producto = await prisma.producto.update({
      where: { id },
      data: validacion.datos,
      include: { categoria: true },
    });
    return NextResponse.json(aProductoDTO(producto));
  } catch (error) {
    return manejarError(error); // P2025 → 404 si el producto no existe
  }
}

export const PUT = (request: NextRequest, ctx: Contexto) => actualizar(request, ctx, false);
export const PATCH = (request: NextRequest, ctx: Contexto) => actualizar(request, ctx, true);

export async function DELETE(_request: NextRequest, ctx: Contexto) {
  try {
    await exigirAdmin();
    const id = await obtenerId(ctx);
    await prisma.producto.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return manejarError(error);
  }
}
