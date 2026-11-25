// PATCH /api/admin/productos/:id  (requiere ADMIN)
// Moderación: el administrador solo puede ocultar o volver a mostrar un
// producto (p. ej. si incumple los principios de comercio justo).
// Cuerpo: { "disponible": false }. El resto de los datos los edita su dueño.
import { NextResponse, type NextRequest } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { INCLUIR_PRODUCTO, aProductoDTO } from "@/lib/serializar";
import { exigirAdmin } from "@/lib/sesion";
import { idValido } from "@/lib/validacion";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/productos/[id]">) {
  try {
    await exigirAdmin();
    const id = idValido((await ctx.params).id);
    if (!id) throw new ErrorApi(400, "Id de producto inválido.");
    const cuerpo = await leerJson(request);
    const disponible =
      typeof cuerpo === "object" && cuerpo !== null ? (cuerpo as Record<string, unknown>).disponible : undefined;
    if (typeof disponible !== "boolean") throw new ErrorApi(422, 'Envía { "disponible": true | false }.');

    const producto = await prisma.producto.update({ where: { id }, data: { disponible }, include: INCLUIR_PRODUCTO });
    return NextResponse.json(aProductoDTO(producto));
  } catch (error) {
    return manejarError(error);
  }
}
