// =============================================================
// Capa de acceso a datos (solo servidor).
// Las páginas y las rutas API usan estas funciones en lugar de
// llamar a Prisma directamente, así la lógica de consultas vive en un solo lugar.
//
// `connection()` le indica a Next.js que estos datos se leen en cada
// petición (no se congelan en el build), para que el menú y los pedidos
// siempre reflejen lo que hay en MySQL.
// =============================================================
import { connection } from "next/server";
import type { EstadoPedido } from "@prisma/client";
import { prisma } from "./prisma";
import { aPedidoDTO, aProductoDTO } from "./serializar";
import type { CategoriaDTO, PedidoDTO, ProductoDTO } from "./tipos";

export async function obtenerCategorias(): Promise<CategoriaDTO[]> {
  await connection();
  return prisma.categoria.findMany({
    select: { id: true, nombre: true, slug: true },
    orderBy: { id: "asc" },
  });
}

interface FiltroProductos {
  categoria?: string; // slug de la categoría
  q?: string; // texto a buscar en nombre o descripción
  soloDisponibles?: boolean;
  soloDestacados?: boolean;
}

export async function obtenerProductos(filtro: FiltroProductos = {}): Promise<ProductoDTO[]> {
  await connection();
  const productos = await prisma.producto.findMany({
    where: {
      ...(filtro.soloDisponibles && { disponible: true }),
      ...(filtro.soloDestacados && { destacado: true }),
      ...(filtro.categoria && { categoria: { slug: filtro.categoria } }),
      ...(filtro.q && {
        OR: [{ nombre: { contains: filtro.q } }, { descripcion: { contains: filtro.q } }],
      }),
    },
    include: { categoria: true },
    orderBy: [{ categoriaId: "asc" }, { nombre: "asc" }],
  });
  return productos.map(aProductoDTO);
}

export async function obtenerProducto(id: number): Promise<ProductoDTO | null> {
  await connection();
  const producto = await prisma.producto.findUnique({ where: { id }, include: { categoria: true } });
  return producto ? aProductoDTO(producto) : null;
}

export async function obtenerPedidoPorCodigo(codigo: string): Promise<PedidoDTO | null> {
  await connection();
  const pedido = await prisma.pedido.findUnique({ where: { codigo }, include: { detalles: true } });
  return pedido ? aPedidoDTO(pedido) : null;
}

export async function obtenerPedidos(estado?: EstadoPedido): Promise<PedidoDTO[]> {
  await connection();
  const pedidos = await prisma.pedido.findMany({
    where: estado ? { estado } : undefined,
    include: { detalles: true },
    orderBy: { fecha: "desc" },
    take: 200, // límite razonable para el panel
  });
  return pedidos.map(aPedidoDTO);
}
