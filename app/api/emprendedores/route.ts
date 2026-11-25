// GET /api/emprendedores  →  emprendedores aprobados con su rubro y barrio (pública)
import { NextResponse } from "next/server";
import { manejarError } from "@/lib/api";
import { obtenerEmprendedores } from "@/lib/datos";

export async function GET() {
  try {
    return NextResponse.json(await obtenerEmprendedores({ soloPublicos: true }));
  } catch (error) {
    return manejarError(error);
  }
}
