// Aviso para el emprendedor cuya solicitud aún no fue aprobada
import Link from "next/link";

export function AvisoAprobacion({ aprobado, slug }: { aprobado: boolean; slug: string }) {
  if (aprobado)
    return (
      <p className="mt-4 rounded-xl bg-exito/10 p-3 text-sm font-semibold text-exito">
        Tu perfil está aprobado y visible en la tienda.{" "}
        <Link href={`/emprendedores/${slug}`} className="underline">
          Ver mi página pública
        </Link>
      </p>
    );
  return (
    <p
      role="status"
      className="mt-4 rounded-xl bg-amber-100 p-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-300"
    >
      Tu solicitud está en revisión. Mientras tanto puedes cargar tus productos y completar tu perfil; aparecerán en el
      catálogo apenas la administración apruebe tu emprendimiento.
    </p>
  );
}
