// PATCH /api/panel/pedidos/:id  →  el emprendedor cambia el estado de SU pedido
// Cuerpo: { "estado": "PREPARANDO" }
import { NextResponse, type NextRequest } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { INCLUIR_PEDIDO, aPedidoDTO } from "@/lib/serializar";
import { exigirEmprendedor } from "@/lib/sesion";
import { idValido, validarEstado } from "@/lib/validacion";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/panel/pedidos/[id]">) {
  try {
    const { emprendedor } = await exigirEmprendedor();
    const id = idValido((await ctx.params).id);
    if (!id) throw new ErrorApi(400, "Id de pedido inválido.");

    const validacion = validarEstado(await leerJson(request));
    if (!validacion.ok) throw new ErrorApi(422, validacion.errores.estado, validacion.errores);

    // updateMany con { id, emprendedorId }: un pedido ajeno no se modifica (IDOR)
    const { count } = await prisma.pedido.updateMany({
      where: { id, emprendedorId: emprendedor.id },
      data: { estado: validacion.datos.estado },
    });
    if (!count) throw new ErrorApi(404, "El pedido no existe.");

    const pedido = await prisma.pedido.findUniqueOrThrow({ where: { id }, include: INCLUIR_PEDIDO });
    return NextResponse.json(aPedidoDTO(pedido));
  } catch (error) {
    return manejarError(error);
  }
}
