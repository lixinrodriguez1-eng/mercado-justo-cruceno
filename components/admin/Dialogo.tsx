"use client";
// Ventana modal basada en el elemento nativo <dialog>:
// atrapa el foco, se cierra con Escape y es accesible sin librerías.
import { useEffect, useRef } from "react";
import { IconoCerrar } from "../Iconos";

interface Props {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: React.ReactNode;
  ancho?: string;
}

export function Dialogo({ abierto, titulo, onCerrar, children, ancho = "max-w-lg" }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      aria-labelledby="titulo-dialogo"
      className={`m-auto max-h-[90dvh] w-[calc(100%-2rem)] ${ancho} flex-col overflow-hidden rounded-2xl bg-white p-0 text-cafe-900 shadow-elevada backdrop:bg-cafe-900/60 open:flex`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-crema-200 px-5 py-4">
        <h2 id="titulo-dialogo" className="text-xl font-bold">
          {titulo}
        </h2>
        <button type="button" onClick={onCerrar} className="grid size-10 cursor-pointer place-items-center rounded-full hover:bg-crema-200" aria-label="Cerrar">
          <IconoCerrar className="size-5" />
        </button>
      </div>
      {/* Solo el contenido hace scroll; el título queda fijo arriba */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{abierto && children}</div>
    </dialog>
  );
}
