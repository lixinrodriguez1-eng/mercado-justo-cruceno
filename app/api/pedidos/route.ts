// POST /api/pedidos  →  registra la compra de un cliente (pública)
//
// Cuerpo esperado:
// { "cliente": "Ana", "telefono": "71234567", "nota": "sin azúcar",
//   "items": [ { "productoId": 2, "cantidad": 1 } ] }
//
// - Los precios NO se toman del navegador (podrían manipularse): se leen de
//   la base de datos y los totales se calculan aquí, en el servidor.
// - Si el carrito tiene productos de varios emprendedores, la compra se
//   reparte en UN PEDIDO POR EMPRENDEDOR: cada uno ve solo lo suyo en su panel
//   y recibe el pago directamente (comercio justo, sin intermediarios).
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { COMISION_PORCENTAJE } from "@/lib/negocio";
import { prisma } from "@/lib/prisma";
import { INCLUIR_RESUMEN, aCompraDTO } from "@/lib/serializar";
import { validarPedido } from "@/lib/validacion";

export async function POST(request: Request) {
  try {
    const validacion = validarPedido(await leerJson(request));
    if (!validacion.ok) throw new ErrorApi(422, "Revisa los datos del pedido.", validacion.errores);
    const { cliente, telefono, nota, items } = validacion.datos;

    // Transacción: o se guarda la compra completa con todos sus pedidos, o nada.
    const compra = await prisma.$transaction(async (tx) => {
      const productos = await tx.producto.findMany({
        where: { id: { in: items.map((i) => i.productoId) } },
        include: { emprendedor: { select: { aprobado: true, usuario: { select: { activo: true } } } } },
      });
      const porId = new Map(productos.map((p) => [p.id, p]));

      // Cada producto debe existir, estar disponible y ser de un emprendedor aprobado y activo
      const noDisponibles = items
        .filter((i) => {
          const p = porId.get(i.productoId);
          return !p?.disponible || !p.emprendedor.aprobado || !p.emprendedor.usuario.activo;
        })
        .map((i) => porId.get(i.productoId)?.nombre ?? `#${i.productoId}`);
      if (noDisponibles.length)
        throw new ErrorApi(409, `Ya no están disponibles: ${noDisponibles.join(", ")}.`, {
          items: "Quita esos productos del carrito e inténtalo de nuevo.",
        });

      // Agrupa las líneas por emprendedor
      const grupos = new Map<
        number,
        {
          productoId: number;
          nombreProducto: string;
          precioUnitario: Prisma.Decimal;
          cantidad: number;
          subtotal: Prisma.Decimal;
        }[]
      >();
      for (const i of items) {
        const p = porId.get(i.productoId)!;
        const linea = {
          productoId: p.id,
          nombreProducto: p.nombre,
          precioUnitario: p.precio,
          cantidad: i.cantidad,
          subtotal: p.precio.mul(i.cantidad),
        };
        grupos.set(p.emprendedorId, [...(grupos.get(p.emprendedorId) ?? []), linea]);
      }

      const pedidos = [...grupos].map(([emprendedorId, detalles]) => {
        const subtotal = detalles.reduce((s, d) => s.add(d.subtotal), new Prisma.Decimal(0));
        const comision = subtotal.mul(COMISION_PORCENTAJE).div(100).toDecimalPlaces(2);
        return {
          emprendedorId,
          subtotal,
          comision,
          montoProductor: subtotal.sub(comision),
          detalles: { create: detalles },
        };
      });
      const total = pedidos.reduce((s, p) => s.add(p.subtotal), new Prisma.Decimal(0));

      return tx.compra.create({
        data: { cliente, telefono, nota, total, pedidos: { create: pedidos } },
        include: {
          pedidos: { include: { detalles: true, emprendedor: { include: INCLUIR_RESUMEN } }, orderBy: { id: "asc" } },
        },
      });
    });

    return NextResponse.json(aCompraDTO(compra), { status: 201 });
  } catch (error) {
    return manejarError(error);
  }
}
