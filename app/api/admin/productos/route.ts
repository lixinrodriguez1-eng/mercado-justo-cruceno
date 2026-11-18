// /api/admin/productos  (requiere sesión de administrador)
//   GET  → todos los productos, incluidos los no disponibles
//   POST → crea un producto nuevo
import { NextResponse } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { obtenerProductos } from "@/lib/datos";
import { prisma } from "@/lib/prisma";
import { aProductoDTO } from "@/lib/serializar";
import { exigirAdmin } from "@/lib/sesion";
import { validarProducto, type DatosProducto } from "@/lib/validacion";

export async function GET() {
  try {
    await exigirAdmin();
    return NextResponse.json(await obtenerProductos());
  } catch (error) {
    return manejarError(error);
  }
}

export async function POST(request: Request) {
  try {
    await exigirAdmin();
    const validacion = validarProducto(await leerJson(request));
    if (!validacion.ok) throw new ErrorApi(422, "Revisa los datos del producto.", validacion.errores);

    const producto = await prisma.producto.create({
      data: validacion.datos as DatosProducto,
      include: { categoria: true },
    });
    return NextResponse.json(aProductoDTO(producto), { status: 201 });
  } catch (error) {
    return manejarError(error);
  }
}
