// PATCH /api/admin/emprendedores/:id  (requiere ADMIN)
// Cuerpo: { "aprobado": true }  → aprueba la solicitud (aparece en la tienda)
//         { "activo": false }   → suspende la cuenta (no puede entrar ni vender)
import { NextResponse, type NextRequest } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { INCLUIR_RESUMEN, aEmprendedorDTO } from "@/lib/serializar";
import { exigirAdmin } from "@/lib/sesion";
import { idValido, validarModeracion } from "@/lib/validacion";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/admin/emprendedores/[id]">) {
  try {
    await exigirAdmin();
    const id = idValido((await ctx.params).id);
    if (!id) throw new ErrorApi(400, "Id de emprendedor inválido.");
    const validacion = validarModeracion(await leerJson(request));
    if (!validacion.ok) throw new ErrorApi(422, "Cambio inválido.", validacion.errores);
    const { aprobado, activo } = validacion.datos;

    const emprendedor = await prisma.emprendedor.update({
      where: { id },
      data: {
        ...(aprobado !== undefined && { aprobado, aprobadoEn: aprobado ? new Date() : null }),
        ...(activo !== undefined && { usuario: { update: { activo } } }),
      },
      include: {
        ...INCLUIR_RESUMEN,
        _count: { select: { productos: true } },
        usuario: { select: { email: true, activo: true } },
      },
    });
    return NextResponse.json(aEmprendedorDTO(emprendedor));
  } catch (error) {
    return manejarError(error); // P2025 → 404 si no existe
  }
}
