"use client";
// Indicador "Abierto ahora / Cerrado" según la hora de Bolivia.
// Se calcula en el navegador después de montar para no generar
// diferencias entre el HTML del servidor y el del cliente.
import { useEffect, useState } from "react";
import { HORARIOS } from "@/lib/negocio";

function estaAbierto(): boolean {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/La_Paz",
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const dias = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dia = dias.indexOf(partes.find((p) => p.type === "weekday")!.value);
  const hora = Number(partes.find((p) => p.type === "hour")!.value) % 24;
  const horario = HORARIOS.find((h) => h.diasSemana.includes(dia));
  return !!horario && hora >= horario.desde && hora < horario.hasta;
}

export function EstadoAbierto() {
  const [abierto, setAbierto] = useState<boolean | null>(null);

  useEffect(() => {
    const actualizar = () => setAbierto(estaAbierto());
    actualizar();
    const id = setInterval(actualizar, 60_000);
    return () => clearInterval(id);
  }, []);

  if (abierto === null) return <span className="inline-block h-7" aria-hidden />;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${
        abierto ? "bg-exito/10 text-exito" : "bg-cafe-100 text-cafe-700"
      }`}
    >
      <span className={`size-2 rounded-full ${abierto ? "bg-exito" : "bg-cafe-500"}`} aria-hidden />
      {abierto ? "Abierto ahora" : "Cerrado en este momento"}
    </span>
  );
}
