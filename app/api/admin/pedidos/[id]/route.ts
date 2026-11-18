// PATCH /api/admin/pedidos/:id  →  cambia el estado de un pedido (requiere sesión)
// Cuerpo: { "estado": "PREPARANDO" }
import { NextResponse, type NextRequest } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { aPedidoDTO } from "@/lib/serializar";
import { exigirAdmin } from "@/lib/sesion";
import { idValido, validarEstado } from "@/lib/validacion";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/pedidos/[id]">) {
  try {
    await exigirAdmin();
    const id = idValido((await ctx.params).id);
    if (!id) throw new ErrorApi(400, "Id de pedido inválido.");

    const validacion = validarEstado(await leerJson(request));
    if (!validacion.ok) throw new ErrorApi(422, validacion.errores.estado, validacion.errores);

    const pedido = await prisma.pedido.update({
      where: { id },
      data: { estado: validacion.datos.estado },
      include: { detalles: true },
    });
    return NextResponse.json(aPedidoDTO(pedido));
  } catch (error) {
    return manejarError(error);
  }
}
