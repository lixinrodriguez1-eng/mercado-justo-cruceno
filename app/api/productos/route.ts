// GET /api/productos  →  productos disponibles del menú (pública)
// Filtros opcionales por query string:
//   ?categoria=cafes   (slug de la categoría)
//   ?q=latte           (busca en nombre y descripción)
//   ?destacados=1      (solo los destacados)
import { NextResponse, type NextRequest } from "next/server";
import { manejarError } from "@/lib/api";
import { obtenerProductos } from "@/lib/datos";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const productos = await obtenerProductos({
      soloDisponibles: true,
      categoria: params.get("categoria")?.slice(0, 60) || undefined,
      q: params.get("q")?.trim().slice(0, 100) || undefined,
      soloDestacados: params.get("destacados") === "1",
    });
    return NextResponse.json(productos);
  } catch (error) {
    return manejarError(error);
  }
}
