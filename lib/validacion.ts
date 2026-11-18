// =============================================================
// Validación de datos que llegan a las rutas API.
// Nunca confiamos en lo que envía el navegador: todo se revisa aquí
// antes de tocar la base de datos.
// =============================================================
import { ESTADOS_PEDIDO, type EstadoPedido } from "./tipos";

export type Errores = Record<string, string>;
export type Resultado<T> = { ok: true; datos: T } | { ok: false; errores: Errores };

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// ---------- Producto ----------
export interface DatosProducto {
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  disponible: boolean;
  destacado: boolean;
  categoriaId: number;
}

/**
 * Valida un producto. Con `parcial = true` (edición rápida) solo se
 * validan los campos que vienen en el cuerpo de la petición.
 */
export function validarProducto(
  cuerpo: unknown,
  parcial = false,
): Resultado<Partial<DatosProducto>> {
  if (!esObjeto(cuerpo)) return { ok: false, errores: { general: "Cuerpo inválido" } };

  const errores: Errores = {};
  const datos: Partial<DatosProducto> = {};
  const debeValidar = (campo: string) => !parcial || campo in cuerpo;

  if (debeValidar("nombre")) {
    const nombre = texto(cuerpo.nombre);
    if (nombre.length < 2 || nombre.length > 100)
      errores.nombre = "El nombre debe tener entre 2 y 100 caracteres.";
    else datos.nombre = nombre;
  }

  if (debeValidar("descripcion")) {
    const descripcion = texto(cuerpo.descripcion);
    if (descripcion.length < 5 || descripcion.length > 1000)
      errores.descripcion = "La descripción debe tener entre 5 y 1000 caracteres.";
    else datos.descripcion = descripcion;
  }

  if (debeValidar("precio")) {
    const precio = Number(cuerpo.precio);
    if (!Number.isFinite(precio) || precio <= 0 || precio > 10000)
      errores.precio = "El precio debe ser un número mayor a 0 y menor a 10 000.";
    else if (Math.round(precio * 100) !== precio * 100)
      errores.precio = "El precio admite como máximo 2 decimales.";
    else datos.precio = precio;
  }

  if (debeValidar("imagen")) {
    const imagen = texto(cuerpo.imagen);
    const esRutaLocal = imagen.startsWith("/") && !imagen.startsWith("//");
    let esUrlSegura = false;
    try {
      esUrlSegura = new URL(imagen).protocol === "https:";
    } catch {
      /* no es una URL */
    }
    if (!imagen || imagen.length > 500 || !(esRutaLocal || esUrlSegura))
      errores.imagen = "La imagen debe ser una URL https:// o una ruta que empiece con /.";
    else datos.imagen = imagen;
  }

  if (debeValidar("categoriaId")) {
    const categoriaId = Number(cuerpo.categoriaId);
    if (!Number.isInteger(categoriaId) || categoriaId <= 0)
      errores.categoriaId = "Selecciona una categoría.";
    else datos.categoriaId = categoriaId;
  }

  for (const campo of ["disponible", "destacado"] as const) {
    if (campo in cuerpo) {
      if (typeof cuerpo[campo] !== "boolean") errores[campo] = "Debe ser verdadero o falso.";
      else datos[campo] = cuerpo[campo] as boolean;
    } else if (!parcial) {
      datos[campo] = campo === "disponible"; // por defecto: disponible y no destacado
    }
  }

  if (parcial && Object.keys(datos).length === 0 && Object.keys(errores).length === 0)
    errores.general = "No se envió ningún campo para actualizar.";

  return Object.keys(errores).length ? { ok: false, errores } : { ok: true, datos };
}

// ---------- Pedido ----------
export interface DatosPedido {
  cliente: string;
  telefono: string;
  nota: string | null;
  items: { productoId: number; cantidad: number }[];
}

export const MAX_CANTIDAD_POR_PRODUCTO = 20;

export function validarPedido(cuerpo: unknown): Resultado<DatosPedido> {
  if (!esObjeto(cuerpo)) return { ok: false, errores: { general: "Cuerpo inválido" } };
  const errores: Errores = {};

  const cliente = texto(cuerpo.cliente);
  if (cliente.length < 2 || cliente.length > 100)
    errores.cliente = "Ingresa tu nombre (entre 2 y 100 caracteres).";
  else if (!/^[\p{L}\s.'-]+$/u.test(cliente))
    errores.cliente = "El nombre solo puede contener letras y espacios.";

  // Teléfono boliviano: 8 dígitos (celular 6/7, fijo 2-4), con o sin +591
  const telefono = texto(cuerpo.telefono).replace(/[\s-]/g, "");
  if (!/^(\+?591)?[2-7]\d{7}$/.test(telefono))
    errores.telefono = "Ingresa un teléfono válido de 8 dígitos (ej. 71234567).";

  const nota = texto(cuerpo.nota);
  if (nota.length > 255) errores.nota = "La nota puede tener como máximo 255 caracteres.";

  // Ítems: se agrupan por producto por si llegan repetidos
  const items = new Map<number, number>();
  if (!Array.isArray(cuerpo.items) || cuerpo.items.length === 0) {
    errores.items = "El carrito está vacío.";
  } else if (cuerpo.items.length > 50) {
    errores.items = "Demasiados productos en un solo pedido.";
  } else {
    for (const item of cuerpo.items) {
      const productoId = Number(esObjeto(item) ? item.productoId : NaN);
      const cantidad = Number(esObjeto(item) ? item.cantidad : NaN);
      if (!Number.isInteger(productoId) || productoId <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
        errores.items = "Hay productos inválidos en el carrito.";
        break;
      }
      items.set(productoId, (items.get(productoId) ?? 0) + cantidad);
    }
    if (!errores.items && [...items.values()].some((c) => c > MAX_CANTIDAD_POR_PRODUCTO))
      errores.items = `Máximo ${MAX_CANTIDAD_POR_PRODUCTO} unidades por producto.`;
  }

  if (Object.keys(errores).length) return { ok: false, errores };
  return {
    ok: true,
    datos: {
      cliente,
      telefono,
      nota: nota || null,
      items: [...items].map(([productoId, cantidad]) => ({ productoId, cantidad })),
    },
  };
}

// ---------- Estado de pedido ----------
export function validarEstado(cuerpo: unknown): Resultado<{ estado: EstadoPedido }> {
  const estado = esObjeto(cuerpo) ? cuerpo.estado : undefined;
  if (typeof estado !== "string" || !ESTADOS_PEDIDO.includes(estado as EstadoPedido))
    return { ok: false, errores: { estado: `Estado inválido. Usa: ${ESTADOS_PEDIDO.join(", ")}.` } };
  return { ok: true, datos: { estado: estado as EstadoPedido } };
}

// Convierte un parámetro de ruta ("12") en id numérico, o null si no es válido
export function idValido(valor: string): number | null {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}
