// Datos fijos del negocio (ficticio) y utilidades de formato.

export const NEGOCIO = {
  nombre: "Café Chiquitano",
  lema: "Café de origen boliviano, hecho a mano en Santa Cruz",
  direccion: "Calle Sucre #245, a dos cuadras de la Plaza 24 de Septiembre",
  ciudad: "Santa Cruz de la Sierra, Bolivia",
  telefono: "+591 70000000", // número ficticio
  whatsapp: "59170000000",
};

// Horarios de atención (se muestran en el inicio y el pie de página)
export const HORARIOS = [
  { dias: "Lunes a viernes", horas: "07:00 – 21:00", desde: 7, hasta: 21, diasSemana: [1, 2, 3, 4, 5] },
  { dias: "Sábados", horas: "08:00 – 22:00", desde: 8, hasta: 22, diasSemana: [6] },
  { dias: "Domingos", horas: "08:00 – 14:00", desde: 8, hasta: 14, diasSemana: [0] },
];

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
