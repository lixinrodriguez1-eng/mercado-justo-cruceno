// =============================================================
// Validación de datos que llegan a las rutas API.
// Nunca confiamos en lo que envía el navegador: todo se revisa aquí
// antes de tocar la base de datos.
// =============================================================
import { ESTADOS_PEDIDO, type EstadoPedido } from "./tipos";

export type Errores = Record<string, string>;
export type Resultado<T> = { ok: true; datos: T } | { ok: false; errores: Errores };

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// =============================================================
// Seguridad (OWASP A05:2025 Injection – XSS almacenado, CWE-79)
//
// Los campos de texto libre (nombre del cliente, nota del pedido, nombre y
// descripción del producto) se DESINFECTAN aquí, en el servidor, antes de
// guardarse en MySQL. Así la base de datos solo contiene texto plano, aunque
// alguien envíe HTML o JavaScript saltándose el formulario (Postman, curl…).
//
// React ya escapa el texto al mostrarlo; esta es una segunda capa (defensa
// en profundidad) que también protege a otros sistemas que lean la base de
// datos: phpMyAdmin, reportes, correos, exportaciones a Excel, etc.
// =============================================================

/** Entidades que podrían usarse para "esconder" etiquetas: &lt;script&gt; */
const ENTIDADES: Record<string, string> = { lt: "<", gt: ">", quot: '"', apos: "'", amp: "&", sol: "/" };

function decodificarEntidades(valor: string): string {
  return valor.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (original, codigo: string) => {
    const c = codigo.toLowerCase();
    if (c.startsWith("#x")) return String.fromCodePoint(parseInt(c.slice(2), 16) || 0x20);
    if (c.startsWith("#")) return String.fromCodePoint(Number(c.slice(1)) || 0x20);
    return ENTIDADES[c] ?? original;
  });
}

/**
 * Convierte cualquier entrada en texto plano seguro:
 * 1. Normaliza Unicode (NFKC) para que caracteres "disfrazados" como ＜ (U+FF1C)
 *    se conviertan en < y también se eliminen.
 * 2. Decodifica entidades HTML (&lt;, &#60;, &#x3c;) para no dejar etiquetas ocultas.
 * 3. Elimina bloques peligrosos completos con su contenido (<script>…</script>,
 *    <style>, <iframe>…). Si la etiqueta no se cierra, solo se quita la etiqueta.
 * 4. Quita cualquier otra etiqueta HTML (<img onerror=…>, <a href=…>, <b>…).
 * 5. Quita los caracteres < > ` y los de control, y neutraliza esquemas
 *    ejecutables (javascript:, vbscript:, data:text/html).
 * 6. Une los espacios repetidos (los saltos de línea solo si `multilinea`).
 */
export function limpiarTexto(valor: unknown, multilinea = false): string {
  if (typeof valor !== "string") return "";
  let limpio = decodificarEntidades(valor.normalize("NFKC"));
  limpio = limpio
    .replace(/<(script|style|iframe|object|embed|svg|math|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<\/?[a-z!?\/][^>]*(>|$)/gi, " ")
    .replace(/[<>`]/g, "")
    .replace(/\b(javascript|vbscript)\s*:/gi, "")
    .replace(/\bdata\s*:\s*text\/html/gi, "")
    // Caracteres de control e invisibles (ancho cero, BOM, separadores de línea Unicode)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]|\p{Cf}|\p{Zl}|\p{Zp}/gu, "");
  limpio = multilinea
    ? limpio
        .replace(/\r\n?/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
    : limpio.replace(/\s+/g, " ");
  return limpio.trim();
}

/**
 * Valida una URL de imagen: solo https:// o una ruta local "/..." (nunca
 * javascript:, data: ni http://). Una URL válida no lleva espacios, comillas
 * ni < > `. Devuelve la URL limpia o null si no es segura.
 */
export function urlSegura(valor: unknown): string | null {
  const url = texto(valor);
  if (!url || url.length > 500 || /[\s"'<>`]/.test(url)) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

// ---------- Producto ----------
export interface DatosProducto {
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  disponible: boolean;
  destacado: boolean;
}

/**
 * Valida un producto. Con `parcial = true` (edición rápida) solo se
 * validan los campos que vienen en el cuerpo de la petición.
 */
export function validarProducto(cuerpo: unknown, parcial = false): Resultado<Partial<DatosProducto>> {
  if (!esObjeto(cuerpo)) return { ok: false, errores: { general: "Cuerpo inválido" } };

  const errores: Errores = {};
  const datos: Partial<DatosProducto> = {};
  const debeValidar = (campo: string) => !parcial || campo in cuerpo;

  if (debeValidar("nombre")) {
    // Seguridad: se guarda solo texto plano (sin HTML ni scripts)
    const nombre = limpiarTexto(cuerpo.nombre);
    if (nombre.length < 2 || nombre.length > 100) errores.nombre = "El nombre debe tener entre 2 y 100 caracteres.";
    else datos.nombre = nombre;
  }

  if (debeValidar("descripcion")) {
    const descripcion = limpiarTexto(cuerpo.descripcion, true);
    if (descripcion.length < 5 || descripcion.length > 1000)
      errores.descripcion = "La descripción debe tener entre 5 y 1000 caracteres.";
    else datos.descripcion = descripcion;
  }

  if (debeValidar("precio")) {
    const precio = Number(cuerpo.precio);
    if (!Number.isFinite(precio) || precio <= 0 || precio > 10000)
      errores.precio = "El precio debe ser un número mayor a 0 y menor a 10 000.";
    else if (Math.round(precio * 100) !== precio * 100) errores.precio = "El precio admite como máximo 2 decimales.";
    else datos.precio = precio;
  }

  if (debeValidar("imagen")) {
    const imagen = urlSegura(cuerpo.imagen);
    if (!imagen) errores.imagen = "La imagen debe ser una URL https:// o una ruta que empiece con /.";
    else datos.imagen = imagen;
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

  // Seguridad: nombre y nota se desinfectan antes de validarse y guardarse
  const cliente = limpiarTexto(cuerpo.cliente);
  if (cliente.length < 2 || cliente.length > 100) errores.cliente = "Ingresa tu nombre (entre 2 y 100 caracteres).";
  else if (!/^[\p{L}\s.'-]+$/u.test(cliente)) errores.cliente = "El nombre solo puede contener letras y espacios.";

  // Teléfono boliviano: 8 dígitos (celular 6/7, fijo 2-4), con o sin +591
  const telefono = texto(cuerpo.telefono).replace(/[\s-]/g, "");
  if (!/^(\+?591)?[2-7]\d{7}$/.test(telefono))
    errores.telefono = "Ingresa un teléfono válido de 8 dígitos (ej. 71234567).";

  const nota = limpiarTexto(cuerpo.nota, true);
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

// ---------- Inicio de sesión ----------
export function validarCredenciales(cuerpo: unknown): Resultado<{ email: string; password: string }> {
  if (!esObjeto(cuerpo)) return { ok: false, errores: { general: "Cuerpo inválido" } };
  const email = texto(cuerpo.email).toLowerCase();
  const password = typeof cuerpo.password === "string" ? cuerpo.password : "";
  // Límite de longitud: bcrypt solo usa 72 bytes y un texto enorme sería un ataque de DoS
  if (!email || email.length > 120 || !password || password.length > 72)
    return { ok: false, errores: { general: "Correo o contraseña incorrectos." } };
  return { ok: true, datos: { email, password } };
}

// ---------- Registro y perfil del emprendedor ----------
export interface DatosPerfil {
  nombre: string;
  emprendimiento: string;
  historia: string;
  whatsapp: string;
  foto: string | null;
  rubroId: number;
  barrioId: number;
}

export interface DatosRegistro extends DatosPerfil {
  email: string;
  password: string;
}

const REGEX_EMAIL = /^[^\s@<>()[\]\,;:"]+@[^\s@<>()[\]\,;:"]+\.[a-z]{2,}$/i;

/**
 * Valida los datos públicos del emprendedor. Los textos libres (nombre,
 * emprendimiento, historia) se desinfectan con limpiarTexto() antes de
 * guardarse: son los que más se muestran en la tienda (XSS almacenado).
 */
export function validarPerfil(cuerpo: unknown): Resultado<DatosPerfil> {
  if (!esObjeto(cuerpo)) return { ok: false, errores: { general: "Cuerpo inválido" } };
  const errores: Errores = {};

  const nombre = limpiarTexto(cuerpo.nombre);
  if (nombre.length < 3 || nombre.length > 100) errores.nombre = "Ingresa tu nombre completo (3 a 100 caracteres).";
  else if (!/^[\p{L}\s.'-]+$/u.test(nombre)) errores.nombre = "El nombre solo puede contener letras y espacios.";

  const emprendimiento = limpiarTexto(cuerpo.emprendimiento);
  if (emprendimiento.length < 3 || emprendimiento.length > 100)
    errores.emprendimiento = "El nombre del emprendimiento debe tener entre 3 y 100 caracteres.";

  const historia = limpiarTexto(cuerpo.historia, true);
  if (historia.length < 40 || historia.length > 2000)
    errores.historia = "Cuenta tu historia en 40 a 2000 caracteres: quién eres, qué haces y cómo lo haces.";

  // WhatsApp boliviano: celular de 8 dígitos que empieza con 6 o 7 (se guarda con 591)
  const digitos = texto(cuerpo.whatsapp).replace(/[\s()+-]/g, "");
  const celular = digitos.startsWith("591") ? digitos.slice(3) : digitos;
  if (!/^[67]\d{7}$/.test(celular)) errores.whatsapp = "Ingresa un celular boliviano de 8 dígitos (ej. 71234567).";

  let foto: string | null = null;
  if (texto(cuerpo.foto)) {
    foto = urlSegura(cuerpo.foto);
    if (!foto) errores.foto = "La foto debe ser una URL que empiece con https://";
  }

  const rubroId = Number(cuerpo.rubroId);
  if (!Number.isInteger(rubroId) || rubroId <= 0) errores.rubroId = "Selecciona tu rubro.";
  const barrioId = Number(cuerpo.barrioId);
  if (!Number.isInteger(barrioId) || barrioId <= 0) errores.barrioId = "Selecciona tu barrio.";

  if (Object.keys(errores).length) return { ok: false, errores };
  return {
    ok: true,
    datos: { nombre, emprendimiento, historia, whatsapp: `591${celular}`, foto, rubroId, barrioId },
  };
}

export function validarRegistro(cuerpo: unknown): Resultado<DatosRegistro> {
  if (!esObjeto(cuerpo)) return { ok: false, errores: { general: "Cuerpo inválido" } };
  const perfil = validarPerfil(cuerpo);
  const errores: Errores = perfil.ok ? {} : { ...perfil.errores };

  const email = texto(cuerpo.email).toLowerCase();
  if (email.length > 120 || !REGEX_EMAIL.test(email)) errores.email = "Ingresa un correo electrónico válido.";

  // Contraseña: mínimo 8 caracteres con letras y números (máx. 72: límite de bcrypt)
  const password = typeof cuerpo.password === "string" ? cuerpo.password : "";
  if (password.length < 8 || password.length > 72 || !/[a-zA-Z]/.test(password) || !/\d/.test(password))
    errores.password = "La contraseña debe tener entre 8 y 72 caracteres, con letras y números.";

  if (cuerpo.acepta !== true) errores.acepta = "Debes aceptar los principios de comercio justo.";

  if (Object.keys(errores).length || !perfil.ok) return { ok: false, errores };
  return { ok: true, datos: { ...perfil.datos, email, password } };
}

// ---------- Moderación (administrador) ----------
export function validarModeracion(cuerpo: unknown): Resultado<{ aprobado?: boolean; activo?: boolean }> {
  if (!esObjeto(cuerpo)) return { ok: false, errores: { general: "Cuerpo inválido" } };
  const datos: { aprobado?: boolean; activo?: boolean } = {};
  for (const campo of ["aprobado", "activo"] as const) {
    if (campo in cuerpo) {
      if (typeof cuerpo[campo] !== "boolean") return { ok: false, errores: { [campo]: "Debe ser verdadero o falso." } };
      datos[campo] = cuerpo[campo] as boolean;
    }
  }
  if (!Object.keys(datos).length) return { ok: false, errores: { general: "No se envió ningún cambio." } };
  return { ok: true, datos };
}
