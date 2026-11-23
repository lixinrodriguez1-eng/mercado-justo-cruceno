// Tipos compartidos entre el servidor y los componentes del cliente.
// Prisma devuelve los precios como `Decimal`; aquí los usamos como `number`
// para poder enviarlos en JSON y mostrarlos fácilmente.

export type EstadoPedido = "PENDIENTE" | "PREPARANDO" | "ENTREGADO";

export const ESTADOS_PEDIDO: EstadoPedido[] = ["PENDIENTE", "PREPARANDO", "ENTREGADO"];

export interface CategoriaDTO {
  id: number;
  nombre: string;
  slug: string;
}

export interface ProductoDTO {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  disponible: boolean;
  destacado: boolean;
  categoriaId: number;
  categoria: CategoriaDTO;
}

export interface DetallePedidoDTO {
  id: number;
  productoId: number | null;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface PedidoDTO {
  id: number;
  codigo: string;
  cliente: string;
  telefono: string;
  nota: string | null;
  total: number;
  estado: EstadoPedido;
  fecha: string; // ISO 8601
  detalles: DetallePedidoDTO[];
}

// WPO: datos mínimos que necesita el botón "Agregar" (componente cliente).
// Enviar solo estos 4 campos, y no el producto completo con su descripción,
// reduce el payload RSC que viaja dentro del HTML de cada página.
export type ProductoCarrito = Pick<ProductoDTO, "id" | "nombre" | "precio" | "imagen">;

// Ítem del carrito (vive en el navegador, NO es la base de datos)
export interface ItemCarrito {
  productoId: number;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
}
