// Tipos compartidos entre el servidor y los componentes del cliente.
// Prisma devuelve los precios como `Decimal`; aquí los usamos como `number`
// para poder enviarlos en JSON y mostrarlos fácilmente.

export type EstadoPedido = "PENDIENTE" | "PREPARANDO" | "ENTREGADO";
export type Rol = "ADMIN" | "EMPRENDEDOR";

export const ESTADOS_PEDIDO: EstadoPedido[] = ["PENDIENTE", "PREPARANDO", "ENTREGADO"];

export interface OpcionDTO {
  id: number;
  nombre: string;
  slug: string;
}

export interface BarrioDTO extends OpcionDTO {
  zona: string;
}

/** Datos mínimos del emprendedor que acompañan a cada producto */
export interface EmprendedorResumenDTO {
  id: number;
  slug: string;
  emprendimiento: string;
  whatsapp: string;
  rubro: OpcionDTO;
  barrio: BarrioDTO;
}

export interface EmprendedorDTO extends EmprendedorResumenDTO {
  nombre: string;
  historia: string;
  foto: string | null;
  aprobado: boolean;
  creadoEn: string; // ISO 8601
  cantidadProductos?: number;
  email?: string; // solo en el panel del administrador
  activo?: boolean;
}

export interface ProductoDTO {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  disponible: boolean;
  destacado: boolean;
  emprendedorId: number;
  emprendedor: EmprendedorResumenDTO;
}

export interface DetallePedidoDTO {
  id: number;
  productoId: number | null;
  nombreProducto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

/** Pedido que recibe un emprendedor (con los datos de contacto de la compra) */
export interface PedidoDTO {
  id: number;
  codigoCompra: string;
  cliente: string;
  telefono: string;
  nota: string | null;
  subtotal: number;
  comision: number;
  montoProductor: number;
  estado: EstadoPedido;
  fecha: string; // ISO 8601
  emprendedor: EmprendedorResumenDTO;
  detalles: DetallePedidoDTO[];
}

/** Compra del cliente: agrupa uno o más pedidos (uno por emprendedor) */
export interface CompraDTO {
  id: number;
  codigo: string;
  cliente: string;
  telefono: string;
  nota: string | null;
  total: number;
  fecha: string;
  pedidos: PedidoDTO[];
}

/** Usuario con sesión iniciada (lo que necesitan las páginas del panel) */
export interface SesionDTO {
  usuarioId: number;
  nombre: string;
  email: string;
  rol: Rol;
  emprendedor: { id: number; slug: string; emprendimiento: string; aprobado: boolean } | null;
}

// WPO: datos mínimos que necesita el botón "Agregar" (componente cliente).
// Enviar solo estos campos, y no el producto completo con su descripción,
// reduce el payload RSC que viaja dentro del HTML de cada página.
export type ProductoCarrito = Pick<ProductoDTO, "id" | "nombre" | "precio" | "imagen"> & {
  emprendimiento: string;
};

// Ítem del carrito (vive en el navegador, NO es la base de datos)
export interface ItemCarrito {
  productoId: number;
  nombre: string;
  precio: number;
  imagen: string;
  emprendimiento: string;
  cantidad: number;
}
