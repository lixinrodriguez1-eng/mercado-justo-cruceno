// POST /api/pedidos  →  registra un pedido del cliente en MySQL (pública)
//
// Cuerpo esperado:
// { "cliente": "Ana", "telefono": "71234567", "nota": "sin azúcar",
//   "items": [ { "productoId": 2, "cantidad": 1 } ] }
//
// IMPORTANTE: los precios NO se toman del navegador (podrían manipularse).
// Se leen de la base de datos y el total se calcula aquí en el servidor.
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ErrorApi, leerJson, manejarError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { aPedidoDTO } from "@/lib/serializar";
import { validarPedido } from "@/lib/validacion";

export async function POST(request: Request) {
  try {
    const validacion = validarPedido(await leerJson(request));
    if (!validacion.ok) throw new ErrorApi(422, "Revisa los datos del pedido.", validacion.errores);
    const { cliente, telefono, nota, items } = validacion.datos;

    // Transacción: o se guarda el pedido completo con sus detalles, o nada.
    const pedido = await prisma.$transaction(async (tx) => {
      const productos = await tx.producto.findMany({
        where: { id: { in: items.map((i) => i.productoId) } },
      });
      const porId = new Map(productos.map((p) => [p.id, p]));

      // Verificamos que cada producto exista y esté disponible
      const noDisponibles = items
        .filter((i) => !porId.get(i.productoId)?.disponible)
        .map((i) => porId.get(i.productoId)?.nombre ?? `#${i.productoId}`);
      if (noDisponibles.length)
        throw new ErrorApi(409, `Ya no están disponibles: ${noDisponibles.join(", ")}.`, {
          items: "Quita esos productos del carrito e inténtalo de nuevo.",
        });

      const detalles = items.map((i) => {
        const p = porId.get(i.productoId)!;
        return {
          productoId: p.id,
          nombreProducto: p.nombre,
          precioUnitario: p.precio,
          cantidad: i.cantidad,
          subtotal: p.precio.mul(i.cantidad),
        };
      });
      const total = detalles.reduce((suma, d) => suma.add(d.subtotal), new Prisma.Decimal(0));

      return tx.pedido.create({
        data: { cliente, telefono, nota, total, detalles: { create: detalles } },
        include: { detalles: true },
      });
    });

    return NextResponse.json(aPedidoDTO(pedido), { status: 201 });
  } catch (error) {
    return manejarError(error);
  }
}
