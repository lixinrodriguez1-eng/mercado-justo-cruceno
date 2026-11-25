// GET /api/admin/productos  →  todos los productos de la plataforma (requiere ADMIN)
import { NextResponse } from "next/server";
import { manejarError } from "@/lib/api";
import { obtenerProductos } from "@/lib/datos";
import { exigirAdmin } from "@/lib/sesion";

export async function GET() {
  try {
    await exigirAdmin();
    return NextResponse.json(await obtenerProductos());
  } catch (error) {
    return manejarError(error);
  }
}
