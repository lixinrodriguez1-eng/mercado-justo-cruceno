// /api/panel/productos/:id  (requiere sesión de EMPRENDEDOR)
//   PUT    → reemplaza todos los datos del producto (formulario de edición)
//   PATCH  → cambia solo algunos campos (ej. { "disponible": false })
//   DELETE → elimina el producto (los pedidos antiguos conservan su detalle)
//
// Seguridad (OWASP A01 – IDOR): cada operación busca el producto con
// { id, emprendedorId de la sesión }. Si el id es de otro emprendedor se
// responde 404, como si no existiera, para no revelar productos ajenos.
import { NextResponse, type NextRequest } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { INCLUIR_PRODUCTO, aProductoDTO } from "@/lib/serializar";
import { exigirEmprendedor } from "@/lib/sesion";
import { idValido, validarProducto } from "@/lib/validacion";

type Contexto = RouteContext<"/api/panel/productos/[id]">;

/** Devuelve el id solo si el producto pertenece al emprendedor con sesión */
async function idPropio(ctx: Contexto): Promise<number> {
  const { emprendedor } = await exigirEmprendedor();
  const id = idValido((await ctx.params).id);
  if (!id) throw new ErrorApi(400, "Id de producto inválido.");
  const propio = await prisma.producto.findFirst({
    where: { id, emprendedorId: emprendedor.id },
    select: { id: true },
  });
  if (!propio) throw new ErrorApi(404, "El producto no existe.");
  return id;
}

async function actualizar(request: NextRequest, ctx: Contexto, parcial: boolean) {
  try {
    const id = await idPropio(ctx);
    const validacion = validarProducto(await leerJson(request), parcial);
    if (!validacion.ok) throw new ErrorApi(422, "Revisa los datos del producto.", validacion.errores);

    const producto = await prisma.producto.update({ where: { id }, data: validacion.datos, include: INCLUIR_PRODUCTO });
    return NextResponse.json(aProductoDTO(producto));
  } catch (error) {
    return manejarError(error);
  }
}

export const PUT = (request: NextRequest, ctx: Contexto) => actualizar(request, ctx, false);
export const PATCH = (request: NextRequest, ctx: Contexto) => actualizar(request, ctx, true);

export async function DELETE(_request: NextRequest, ctx: Contexto) {
  try {
    const id = await idPropio(ctx);
    await prisma.producto.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return manejarError(error);
  }
}
