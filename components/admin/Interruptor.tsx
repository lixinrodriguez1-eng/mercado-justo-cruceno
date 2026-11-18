"use client";
// Interruptor accesible (role="switch") para valores sí/no
interface Props {
  activo: boolean;
  etiqueta: string; // texto para lectores de pantalla
  onCambiar: () => void;
  deshabilitado?: boolean;
}

export function Interruptor({ activo, etiqueta, onCambiar, deshabilitado }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={onCambiar}
      disabled={deshabilitado}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
        activo ? "bg-exito" : "bg-cafe-300"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow transition-transform duration-200 ${
          activo ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
