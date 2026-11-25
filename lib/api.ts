// Utilidades comunes para las rutas API: respuestas JSON y manejo de errores.
import { Prisma } from "@prisma/client";
import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";
import type { Errores } from "./validacion";

/** Error controlado que se convierte en una respuesta HTTP con su código. */
export class ErrorApi extends Error {
  constructor(
    public status: number,
    mensaje: string,
    public errores?: Errores,
  ) {
    super(mensaje);
  }
}

export function respuestaError(status: number, mensaje: string, errores?: Errores) {
  return NextResponse.json({ error: mensaje, ...(errores && { errores }) }, { status });
}

/** Lee el cuerpo JSON; si viene mal formado responde 400 en lugar de romper. */
export async function leerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ErrorApi(400, "El cuerpo de la petición no es un JSON válido.");
  }
}

/** Traduce cualquier error a una respuesta clara para el cliente. */
export function manejarError(error: unknown) {
  // Next.js usa errores internos para controlar el renderizado (por ejemplo,
  // al detener el pre-renderizado en `connection()`); esos se dejan pasar.
  unstable_rethrow(error);

  if (error instanceof ErrorApi) return respuestaError(error.status, error.message, error.errores);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Códigos de Prisma: https://www.prisma.io/docs/orm/reference/error-reference
    if (error.code === "P2025") return respuestaError(404, "El registro no existe.");
    if (error.code === "P2003")
      return respuestaError(409, "El registro relacionado no existe o tiene pedidos asociados.");
    if (error.code === "P2002") return respuestaError(409, "Ya existe un registro con esos datos.");
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("[API] No se pudo conectar a MySQL:", error.message);
    return respuestaError(503, "La base de datos no está disponible en este momento. Inténtalo en unos segundos.");
  }

  console.error("[API] Error inesperado:", error);
  return respuestaError(500, "Ocurrió un error inesperado en el servidor.");
}
