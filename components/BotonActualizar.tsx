"use client";
// Vuelve a pedir los datos al servidor sin recargar toda la página.
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function BotonActualizar({ texto = "Actualizar estado" }: { texto?: string }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  return (
    <button type="button" onClick={() => iniciar(() => router.refresh())} disabled={pendiente} className="btn-secundario">
      {pendiente ? "Actualizando…" : texto}
    </button>
  );
}
