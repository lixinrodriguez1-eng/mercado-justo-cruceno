// GET /api/productos  →  productos disponibles del catálogo (pública)
// Filtros opcionales por query string:
//   ?rubro=gastronomia     (slug del rubro del emprendedor)
//   ?barrio=plan-3000      (slug del barrio)
//   ?emprendedor=cafe-chiquitano
//   ?q=miel                (busca en nombre y descripción)
//   ?destacados=1          (solo los destacados)
// Prisma usa consultas parametrizadas: los filtros nunca se concatenan al SQL
// (protección contra inyección SQL, OWASP A05).
import { NextResponse, type NextRequest } from "next/server";
import { manejarError } from "@/lib/api";
import { obtenerProductos } from "@/lib/datos";

const slug = (v: string | null) => (v && /^[a-z0-9-]{1,80}$/.test(v) ? v : undefined);

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const productos = await obtenerProductos({
      publicos: true,
      rubro: slug(params.get("rubro")),
      barrio: slug(params.get("barrio")),
      emprendedorSlug: slug(params.get("emprendedor")),
      q: params.get("q")?.trim().slice(0, 100) || undefined,
      soloDestacados: params.get("destacados") === "1",
    });
    return NextResponse.json(productos);
  } catch (error) {
    return manejarError(error);
  }
}
