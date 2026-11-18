// GET /api/categorias  →  lista de categorías del menú (pública)
import { NextResponse } from "next/server";
import { manejarError } from "@/lib/api";
import { obtenerCategorias } from "@/lib/datos";

export async function GET() {
  try {
    return NextResponse.json(await obtenerCategorias());
  } catch (error) {
    return manejarError(error);
  }
}
