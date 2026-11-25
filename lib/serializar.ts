// Convierte los objetos de Prisma (con Decimal y Date) a objetos simples
// que se pueden enviar como JSON o pasar a componentes de cliente.
import type { Prisma } from "@prisma/client";
import type { CompraDTO, EmprendedorDTO, EmprendedorResumenDTO, PedidoDTO, ProductoDTO } from "./tipos";

// Consultas reutilizables: qué relaciones se cargan en cada caso
export const INCLUIR_RESUMEN = { rubro: true, barrio: true } as const;
export const INCLUIR_PRODUCTO = { emprendedor: { include: INCLUIR_RESUMEN } } as const;
export const INCLUIR_PEDIDO = {
  compra: true,
  detalles: true,
  emprendedor: { include: INCLUIR_RESUMEN },
} as const;

type EmprendedorConRelaciones = Prisma.EmprendedorGetPayload<{ include: typeof INCLUIR_RESUMEN }>;
type ProductoConEmprendedor = Prisma.ProductoGetPayload<{ include: typeof INCLUIR_PRODUCTO }>;
type PedidoCompleto = Prisma.PedidoGetPayload<{ include: typeof INCLUIR_PEDIDO }>;

export function aResumenDTO(e: EmprendedorConRelaciones): EmprendedorResumenDTO {
  return {
    id: e.id,
    slug: e.slug,
    emprendimiento: e.emprendimiento,
    whatsapp: e.whatsapp,
    rubro: { id: e.rubro.id, nombre: e.rubro.nombre, slug: e.rubro.slug },
    barrio: { id: e.barrio.id, nombre: e.barrio.nombre, slug: e.barrio.slug, zona: e.barrio.zona },
  };
}

export function aEmprendedorDTO(
  e: EmprendedorConRelaciones & { _count?: { productos: number }; usuario?: { email: string; activo: boolean } },
): EmprendedorDTO {
  return {
    ...aResumenDTO(e),
    nombre: e.nombre,
    historia: e.historia,
    foto: e.foto,
    aprobado: e.aprobado,
    creadoEn: e.creadoEn.toISOString(),
    ...(e._count && { cantidadProductos: e._count.productos }),
    ...(e.usuario && { email: e.usuario.email, activo: e.usuario.activo }),
  };
}

export function aProductoDTO(p: ProductoConEmprendedor): ProductoDTO {
  return {
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: Number(p.precio),
    imagen: p.imagen,
    disponible: p.disponible,
    destacado: p.destacado,
    emprendedorId: p.emprendedorId,
    emprendedor: aResumenDTO(p.emprendedor),
  };
}

export function aPedidoDTO(p: PedidoCompleto): PedidoDTO {
  return {
    id: p.id,
    codigoCompra: p.compra.codigo,
    cliente: p.compra.cliente,
    telefono: p.compra.telefono,
    nota: p.compra.nota,
    subtotal: Number(p.subtotal),
    comision: Number(p.comision),
    montoProductor: Number(p.montoProductor),
    estado: p.estado,
    fecha: p.fecha.toISOString(),
    emprendedor: aResumenDTO(p.emprendedor),
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

export function aCompraDTO(
  c: Prisma.CompraGetPayload<{
    include: { pedidos: { include: { detalles: true; emprendedor: { include: typeof INCLUIR_RESUMEN } } } };
  }>,
): CompraDTO {
  return {
    id: c.id,
    codigo: c.codigo,
    cliente: c.cliente,
    telefono: c.telefono,
    nota: c.nota,
    total: Number(c.total),
    fecha: c.fecha.toISOString(),
    pedidos: c.pedidos.map((p) => aPedidoDTO({ ...p, compra: c })),
  };
}
