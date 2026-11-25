// /api/panel/productos  (requiere sesión de EMPRENDEDOR)
//   GET  → los productos DEL emprendedor con sesión (incluidos los no disponibles)
//   POST → crea un producto que pertenece al emprendedor con sesión
// El emprendedorId SIEMPRE sale de la sesión, nunca del cuerpo de la petición:
// así nadie puede crear productos a nombre de otro (OWASP A01, control de acceso).
import { NextResponse } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { obtenerProductos } from "@/lib/datos";
import { prisma } from "@/lib/prisma";
import { INCLUIR_PRODUCTO, aProductoDTO } from "@/lib/serializar";
import { exigirEmprendedor } from "@/lib/sesion";
import { validarProducto, type DatosProducto } from "@/lib/validacion";

export async function GET() {
  try {
    const { emprendedor } = await exigirEmprendedor();
    return NextResponse.json(await obtenerProductos({ emprendedorId: emprendedor.id }));
  } catch (error) {
    return manejarError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { emprendedor } = await exigirEmprendedor();
    const validacion = validarProducto(await leerJson(request));
    if (!validacion.ok) throw new ErrorApi(422, "Revisa los datos del producto.", validacion.errores);

    const producto = await prisma.producto.create({
      data: { ...(validacion.datos as DatosProducto), emprendedorId: emprendedor.id },
      include: INCLUIR_PRODUCTO,
    });
    return NextResponse.json(aProductoDTO(producto), { status: 201 });
  } catch (error) {
    return manejarError(error);
  }
}
