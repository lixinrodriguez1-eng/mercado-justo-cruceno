// Pequeño ayudante para llamar a las rutas API desde el navegador.
// Devuelve siempre un objeto con la misma forma, así los componentes
// manejan éxito y error de manera uniforme.

export interface RespuestaApi<T> {
  ok: boolean;
  status: number;
  datos?: T;
  error?: string;
  errores?: Record<string, string>;
}

export async function pedirApi<T>(url: string, opciones: RequestInit = {}): Promise<RespuestaApi<T>> {
  try {
    const respuesta = await fetch(url, {
      ...opciones,
      headers: { "Content-Type": "application/json", ...opciones.headers },
    });

    // Sesión vencida: volvemos al inicio de sesión. Se recarga la página
    // completa a propósito para descartar cualquier dato del panel en memoria.
    if (respuesta.status === 401 && /^\/api\/(admin|panel)\//.test(url)) {
      const login = new URL("/ingresar", window.location.origin);
      login.searchParams.set("desde", window.location.pathname);
      window.location.assign(login);
      return { ok: false, status: 401, error: "Sesión vencida." };
    }

    const cuerpo = respuesta.status === 204 ? undefined : await respuesta.json().catch(() => undefined);
    if (!respuesta.ok)
      return {
        ok: false,
        status: respuesta.status,
        error: cuerpo?.error ?? "Ocurrió un error.",
        errores: cuerpo?.errores,
      };
    return { ok: true, status: respuesta.status, datos: cuerpo as T };
  } catch {
    return { ok: false, status: 0, error: "Sin conexión con el servidor." };
  }
}
