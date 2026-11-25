// GET /api/panel/pedidos?estado=PENDIENTE  →  pedidos DEL emprendedor con sesión
import { NextResponse, type NextRequest } from "next/server";
import { ErrorApi, manejarError } from "@/lib/api";
import { obtenerPedidos } from "@/lib/datos";
import { exigirEmprendedor } from "@/lib/sesion";
import { validarEstado } from "@/lib/validacion";

export async function GET(request: NextRequest) {
  try {
    const { emprendedor } = await exigirEmprendedor();
    const estado = request.nextUrl.searchParams.get("estado");
    if (estado) {
      const validacion = validarEstado({ estado });
      if (!validacion.ok) throw new ErrorApi(400, validacion.errores.estado);
      return NextResponse.json(
        await obtenerPedidos({ emprendedorId: emprendedor.id, estado: validacion.datos.estado }),
      );
    }
    return NextResponse.json(await obtenerPedidos({ emprendedorId: emprendedor.id }));
  } catch (error) {
    return manejarError(error);
  }
}
