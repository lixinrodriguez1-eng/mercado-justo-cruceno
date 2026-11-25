// /api/panel/perfil  (requiere sesión de EMPRENDEDOR)
//   GET → datos del perfil público del emprendedor con sesión
//   PUT → actualiza su perfil (historia, WhatsApp, foto, rubro, barrio...)
import { NextResponse } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { obtenerEmprendedorPorId } from "@/lib/datos";
import { prisma } from "@/lib/prisma";
import { INCLUIR_RESUMEN, aEmprendedorDTO } from "@/lib/serializar";
import { exigirEmprendedor } from "@/lib/sesion";
import { validarPerfil } from "@/lib/validacion";

export async function GET() {
  try {
    const { emprendedor } = await exigirEmprendedor();
    return NextResponse.json(await obtenerEmprendedorPorId(emprendedor.id));
  } catch (error) {
    return manejarError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const sesion = await exigirEmprendedor();
    const validacion = validarPerfil(await leerJson(request));
    if (!validacion.ok) throw new ErrorApi(422, "Revisa los datos del perfil.", validacion.errores);
    const { nombre, ...perfil } = validacion.datos;

    const [rubro, barrio] = await Promise.all([
      prisma.rubro.findUnique({ where: { id: perfil.rubroId } }),
      prisma.barrio.findUnique({ where: { id: perfil.barrioId } }),
    ]);
    if (!rubro || !barrio)
      throw new ErrorApi(422, "Revisa los datos del perfil.", {
        ...(!rubro && { rubroId: "Selecciona un rubro de la lista." }),
        ...(!barrio && { barrioId: "Selecciona un barrio de la lista." }),
      });

    const [emprendedor] = await prisma.$transaction([
      prisma.emprendedor.update({
        where: { id: sesion.emprendedor.id },
        data: { ...perfil, nombre },
        include: INCLUIR_RESUMEN,
      }),
      prisma.usuario.update({ where: { id: sesion.usuarioId }, data: { nombre } }),
    ]);
    return NextResponse.json(aEmprendedorDTO(emprendedor));
  } catch (error) {
    return manejarError(error);
  }
}
