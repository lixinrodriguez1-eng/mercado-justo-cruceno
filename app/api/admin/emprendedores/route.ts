// GET /api/admin/emprendedores  →  todos los emprendedores, primero los pendientes (requiere ADMIN)
import { NextResponse } from "next/server";
import { manejarError } from "@/lib/api";
import { obtenerEmprendedores } from "@/lib/datos";
import { exigirAdmin } from "@/lib/sesion";

export async function GET() {
  try {
    await exigirAdmin();
    return NextResponse.json(await obtenerEmprendedores({ soloPublicos: false }));
  } catch (error) {
    return manejarError(error);
  }
}
