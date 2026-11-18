// GET /api/productos/:id  →  detalle de un producto (pública)
import { NextResponse, type NextRequest } from "next/server";
import { manejarError, respuestaError } from "@/lib/api";
import { obtenerProducto } from "@/lib/datos";
import { idValido } from "@/lib/validacion";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/productos/[id]">) {
  try {
    const id = idValido((await ctx.params).id);
    if (!id) return respuestaError(400, "Id de producto inválido.");

    const producto = await obtenerProducto(id);
    if (!producto || !producto.disponible) return respuestaError(404, "Producto no encontrado.");
    return NextResponse.json(producto);
  } catch (error) {
    return manejarError(error);
  }
}
