"use client";
// Pantalla de error amigable (por ejemplo, si MySQL está apagado).
import { useEffect } from "react";

export default function ErrorPagina({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="contenedor flex min-h-[70dvh] flex-col items-center justify-center py-16 text-center">
      <h1 className="text-3xl font-bold">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-cafe-600">
        No pudimos cargar la información. Si eres el administrador, verifica que MySQL esté encendido en XAMPP.
      </p>
      <button type="button" onClick={reset} className="btn-primario mt-6">
        Intentar de nuevo
      </button>
    </main>
  );
}
