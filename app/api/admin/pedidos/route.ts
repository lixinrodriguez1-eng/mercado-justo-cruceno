// GET /api/admin/pedidos?estado=PENDIENTE  →  lista de pedidos (requiere sesión)
import { NextResponse, type NextRequest } from "next/server";
import { ErrorApi, manejarError } from "@/lib/api";
import { obtenerPedidos } from "@/lib/datos";
import { exigirAdmin } from "@/lib/sesion";
import { validarEstado } from "@/lib/validacion";

export async function GET(request: NextRequest) {
  try {
    await exigirAdmin();
    const estado = request.nextUrl.searchParams.get("estado");
    if (estado) {
      const validacion = validarEstado({ estado });
      if (!validacion.ok) throw new ErrorApi(400, validacion.errores.estado);
      return NextResponse.json(await obtenerPedidos(validacion.datos.estado));
    }
    return NextResponse.json(await obtenerPedidos());
  } catch (error) {
    return manejarError(error);
  }
}
