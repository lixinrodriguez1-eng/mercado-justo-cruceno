// =============================================================
// Capa de acceso a datos (solo servidor).
// Las páginas y las rutas API usan estas funciones en lugar de
// llamar a Prisma directamente, así la lógica de consultas vive en un solo lugar.
//
// `connection()` le indica a Next.js que estos datos se leen en cada
// petición (no se congelan en el build), para que el catálogo y los pedidos
// siempre reflejen lo que hay en MySQL.
// =============================================================
import { connection } from "next/server";
import type { EstadoPedido, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import {
  INCLUIR_PEDIDO,
  INCLUIR_PRODUCTO,
  INCLUIR_RESUMEN,
  aCompraDTO,
  aEmprendedorDTO,
  aPedidoDTO,
  aProductoDTO,
} from "./serializar";
import type { BarrioDTO, CompraDTO, EmprendedorDTO, OpcionDTO, PedidoDTO, ProductoDTO } from "./tipos";

// Un emprendedor es PÚBLICO solo si el administrador lo aprobó y su cuenta está activa
const EMPRENDEDOR_PUBLICO: Prisma.EmprendedorWhereInput = { aprobado: true, usuario: { activo: true } };

export async function obtenerRubros(): Promise<OpcionDTO[]> {
  await connection();
  return prisma.rubro.findMany({ select: { id: true, nombre: true, slug: true }, orderBy: { nombre: "asc" } });
}

export async function obtenerBarrios(): Promise<BarrioDTO[]> {
  await connection();
  return prisma.barrio.findMany({
    select: { id: true, nombre: true, slug: true, zona: true },
    orderBy: { nombre: "asc" },
  });
}

// ---------- Productos ----------
interface FiltroProductos {
  publicos?: boolean; // disponibles y de emprendedores aprobados (tienda)
  soloDestacados?: boolean;
  emprendedorId?: number; // panel del emprendedor: solo los suyos
  emprendedorSlug?: string;
  rubro?: string; // slug
  barrio?: string; // slug
  q?: string; // texto a buscar en nombre o descripción
}

export async function obtenerProductos(filtro: FiltroProductos = {}): Promise<ProductoDTO[]> {
  await connection();
  const emprendedor: Prisma.EmprendedorWhereInput = {
    ...(filtro.publicos && EMPRENDEDOR_PUBLICO),
    ...(filtro.emprendedorSlug && { slug: filtro.emprendedorSlug }),
    ...(filtro.rubro && { rubro: { slug: filtro.rubro } }),
    ...(filtro.barrio && { barrio: { slug: filtro.barrio } }),
  };
  const productos = await prisma.producto.findMany({
    where: {
      ...(filtro.publicos && { disponible: true }),
      ...(filtro.soloDestacados && { destacado: true }),
      ...(filtro.emprendedorId && { emprendedorId: filtro.emprendedorId }),
      ...(Object.keys(emprendedor).length && { emprendedor }),
      ...(filtro.q && {
        OR: [{ nombre: { contains: filtro.q } }, { descripcion: { contains: filtro.q } }],
      }),
    },
    include: INCLUIR_PRODUCTO,
    orderBy: [{ emprendedorId: "asc" }, { nombre: "asc" }],
  });
  return productos.map(aProductoDTO);
}

export async function obtenerProductoPublico(id: number): Promise<ProductoDTO | null> {
  await connection();
  const producto = await prisma.producto.findFirst({
    where: { id, disponible: true, emprendedor: EMPRENDEDOR_PUBLICO },
    include: INCLUIR_PRODUCTO,
  });
  return producto ? aProductoDTO(producto) : null;
}

// ---------- Emprendedores ----------
export async function obtenerEmprendedores({ soloPublicos = true } = {}): Promise<EmprendedorDTO[]> {
  await connection();
  const emprendedores = await prisma.emprendedor.findMany({
    where: soloPublicos ? EMPRENDEDOR_PUBLICO : undefined,
    include: {
      ...INCLUIR_RESUMEN,
      _count: { select: { productos: soloPublicos ? { where: { disponible: true } } : true } },
      ...(!soloPublicos && { usuario: { select: { email: true, activo: true } } }),
    },
    // En el panel del admin, las solicitudes pendientes aparecen primero
    orderBy: soloPublicos ? { emprendimiento: "asc" } : [{ aprobado: "asc" }, { creadoEn: "desc" }],
  });
  return emprendedores.map(aEmprendedorDTO);
}

export async function obtenerEmprendedorPublico(slug: string): Promise<EmprendedorDTO | null> {
  await connection();
  const e = await prisma.emprendedor.findFirst({ where: { slug, ...EMPRENDEDOR_PUBLICO }, include: INCLUIR_RESUMEN });
  return e ? aEmprendedorDTO(e) : null;
}

export async function obtenerEmprendedorPorId(id: number): Promise<EmprendedorDTO | null> {
  await connection();
  const e = await prisma.emprendedor.findUnique({ where: { id }, include: INCLUIR_RESUMEN });
  return e ? aEmprendedorDTO(e) : null;
}

// ---------- Compras y pedidos ----------
export async function obtenerCompraPorCodigo(codigo: string): Promise<CompraDTO | null> {
  await connection();
  const compra = await prisma.compra.findUnique({
    where: { codigo },
    include: {
      pedidos: { include: { detalles: true, emprendedor: { include: INCLUIR_RESUMEN } }, orderBy: { id: "asc" } },
    },
  });
  return compra ? aCompraDTO(compra) : null;
}

/** Pedidos del panel. Sin emprendedorId (administrador) devuelve los de todos. */
export async function obtenerPedidos(
  filtro: { emprendedorId?: number; estado?: EstadoPedido } = {},
): Promise<PedidoDTO[]> {
  await connection();
  const pedidos = await prisma.pedido.findMany({
    where: {
      ...(filtro.emprendedorId && { emprendedorId: filtro.emprendedorId }),
      ...(filtro.estado && { estado: filtro.estado }),
    },
    include: INCLUIR_PEDIDO,
    orderBy: { fecha: "desc" },
    take: 200, // límite razonable para el panel
  });
  return pedidos.map(aPedidoDTO);
}

/** Cifras del impacto de la plataforma (inicio y panel del administrador) */
export async function obtenerResumenPlataforma() {
  await connection();
  const [emprendedores, pendientes, productos, barrios, ventas] = await Promise.all([
    prisma.emprendedor.count({ where: EMPRENDEDOR_PUBLICO }),
    prisma.emprendedor.count({ where: { aprobado: false } }),
    prisma.producto.count({ where: { disponible: true, emprendedor: EMPRENDEDOR_PUBLICO } }),
    prisma.barrio.count({ where: { emprendedores: { some: EMPRENDEDOR_PUBLICO } } }),
    prisma.pedido.aggregate({ _sum: { montoProductor: true, comision: true }, _count: true }),
  ]);
  return {
    emprendedores,
    pendientes,
    productos,
    barrios,
    pedidos: ventas._count,
    montoProductores: Number(ventas._sum.montoProductor ?? 0),
    comisiones: Number(ventas._sum.comision ?? 0),
  };
}
