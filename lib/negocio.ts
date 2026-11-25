// Datos fijos de la plataforma (ficticia) y utilidades de formato.

export const PLATAFORMA = {
  nombre: "Mercado Justo Cruceño",
  lema: "Compra directo a emprendedores de los barrios de Santa Cruz",
  ciudad: "Santa Cruz de la Sierra, Bolivia",
};

// =============================================================
// Comercio justo transparente.
// La plataforma cobra 0 % de comisión: el productor recibe el 100 % del
// precio. El valor vive en una sola constante para que, si algún día se
// cobra una comisión baja (p. ej. 3 %), el cálculo y todos los textos que
// la muestran (tarjetas, confirmación, paneles) cambien a la vez.
// =============================================================
export const COMISION_PORCENTAJE = 0;

/** Desglose de un monto: cuánto se queda la plataforma y cuánto recibe el productor */
export function desglosarMonto(monto: number) {
  const comision = Math.round(monto * COMISION_PORCENTAJE) / 100;
  return { comision, productor: Math.round((monto - comision) * 100) / 100 };
}

const formatoBs = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 2,
});

/** 18 → "Bs 18,00" */
export const formatearPrecio = (monto: number) => formatoBs.format(monto);

/** Fecha y hora en horario de Bolivia */
export const formatearFecha = (iso: string) =>
  new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/La_Paz",
  }).format(new Date(iso));

export const ETIQUETA_ESTADO = {
  PENDIENTE: "Pendiente",
  PREPARANDO: "Preparando",
  ENTREGADO: "Entregado",
} as const;

/** Enlace de WhatsApp con un mensaje ya escrito */
export const enlaceWhatsApp = (numero: string, mensaje: string) =>
  `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

/** Número de pedido legible: 7 → "00007" */
export const numeroPedido = (id: number) => String(id).padStart(5, "0");

/** "Café Chiquitano" → "cafe-chiquitano" (para URLs) */
export const crearSlug = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
