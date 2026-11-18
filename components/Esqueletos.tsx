// Esqueletos de carga: se muestran al instante mientras llegan los datos de MySQL.
export function EsqueletoTarjetas({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Cargando productos">
      {Array.from({ length: cantidad }, (_, i) => (
        <div key={i} className="tarjeta overflow-hidden">
          <div className="aspect-[4/3] animate-pulse bg-crema-200" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-2/3 animate-pulse rounded bg-crema-200" />
            <div className="h-4 w-full animate-pulse rounded bg-crema-100" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-crema-100" />
            <div className="h-11 animate-pulse rounded-full bg-crema-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EsqueletoLista({ filas = 4 }: { filas?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="tarjeta h-24 animate-pulse bg-white/70" />
      ))}
    </div>
  );
}
