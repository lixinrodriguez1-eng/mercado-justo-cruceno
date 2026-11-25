// Íconos SVG livianos (sin librerías externas → menos JavaScript).
// Son decorativos: llevan aria-hidden y el texto accesible va en el botón/enlace.
type P = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  viewBox: "0 0 24 24",
};

export const IconoTaza = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <path d="M6 2v2M10 2v2M14 2v2" />
  </svg>
);
export const IconoCarrito = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);
export const IconoMenu = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
export const IconoCerrar = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const IconoReloj = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
export const IconoUbicacion = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
export const IconoBuscar = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
export const IconoMas = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconoMenos = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}>
    <path d="M5 12h14" />
  </svg>
);
export const IconoBasura = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </svg>
);
export const IconoEditar = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);
export const IconoCheck = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
export const IconoManos = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
    <path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
    <path d="m2 15 6 6" />
  </svg>
);
export const IconoCelular = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M12 18h.01" />
  </svg>
);
export const IconoHoja = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6" />
  </svg>
);
export const IconoTienda = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
    <path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
  </svg>
);
export const IconoMensaje = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);
export const IconoUsuario = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8" r="5" />
    <path d="M20 21a8 8 0 0 0-16 0" />
  </svg>
);
export const IconoEscudo = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const IconoGrafico = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);
export const IconoLibro = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M12 7v14" />
    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
  </svg>
);
export const IconoIgualdad = ({ className = "size-6" }: P) => (
  <svg {...base} className={className}>
    <path d="M5 9h14M5 15h14" />
  </svg>
);
