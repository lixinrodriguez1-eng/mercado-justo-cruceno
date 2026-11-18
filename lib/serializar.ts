// Convierte los objetos de Prisma (con Decimal y Date) a objetos simples
// que se pueden enviar como JSON o pasar a componentes de cliente.
import type { Prisma } from "@prisma/client";
import type { PedidoDTO, ProductoDTO } from "./tipos";

type ProductoConCategoria = Prisma.ProductoGetPayload<{ include: { categoria: true } }>;
type PedidoConDetalles = Prisma.PedidoGetPayload<{ include: { detalles: true } }>;

export function aProductoDTO(p: ProductoConCategoria): ProductoDTO {
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: Number(p.precio),
    imagen: p.imagen,
    disponible: p.disponible,
    destacado: p.destacado,
    categoriaId: p.categoriaId,
    categoria: { id: p.categoria.id, nombre: p.categoria.nombre, slug: p.categoria.slug },
  };
}

export function aPedidoDTO(p: PedidoConDetalles): PedidoDTO {
  return {
    id: p.id,
    codigo: p.codigo,
    cliente: p.cliente,
    telefono: p.telefono,
    nota: p.nota,
    total: Number(p.total),
    estado: p.estado,
    fecha: p.fecha.toISOString(),
    detalles: p.detalles.map((d) => ({
      id: d.id,
      productoId: d.productoId,
      nombreProducto: d.nombreProducto,
      precioUnitario: Number(d.precioUnitario),
      cantidad: d.cantidad,
      subtotal: Number(d.subtotal),
    })),
  };
}
