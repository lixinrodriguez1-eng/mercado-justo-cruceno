// =============================================================
// Sesiones firmadas (sin estado en el servidor).
// Al iniciar sesión se guarda una cookie httpOnly con un token firmado
// (HMAC-SHA256) que incluye el id del usuario, su rol y la fecha de
// expiración. Sin la clave AUTH_SECRET nadie puede fabricar ni modificar
// un token válido (por ejemplo, cambiar EMPRENDEDOR por ADMIN).
// Usa Web Crypto, disponible tanto en las rutas API como en proxy.ts.
// Las contraseñas se verifican con bcrypt en lib/contrasena.ts.
// =============================================================
import type { Rol } from "./tipos";

export const COOKIE_SESION = "mjc_sesion";
export const DURACION_SESION_SEG = 60 * 60 * 8; // 8 horas

const codificador = new TextEncoder();
const ROLES: Rol[] = ["ADMIN", "EMPRENDEDOR"];

function obtenerSecreto(): string {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto || secreto.length < 16)
    throw new Error("Falta AUTH_SECRET en las variables de entorno (mínimo 16 caracteres).");
  return secreto;
}

async function firmar(mensaje: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    "raw",
    codificador.encode(obtenerSecreto()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", clave, codificador.encode(mensaje));
  return Array.from(new Uint8Array(firma), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Compara dos textos en tiempo constante (evita ataques de temporización). */
function igualesSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

/** Token: "<usuarioId>.<rol>.<expira>.<firma>" */
export async function crearToken(usuarioId: number, rol: Rol): Promise<string> {
  const expira = Date.now() + DURACION_SESION_SEG * 1000;
  const cuerpo = `${usuarioId}.${rol}.${expira}`;
  return `${cuerpo}.${await firmar(cuerpo)}`;
}

export interface DatosToken {
  usuarioId: number;
  rol: Rol;
}

/** Devuelve los datos del token si la firma es válida y no venció; si no, null. */
export async function leerToken(token: string | undefined): Promise<DatosToken | null> {
  if (!token || token.length > 200) return null;
  const partes = token.split(".");
  if (partes.length !== 4) return null;
  const [id, rol, expira, firma] = partes;
  const usuarioId = Number(id);
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) return null;
  if (!ROLES.includes(rol as Rol) || !(Number(expira) > Date.now())) return null;
  if (!igualesSeguro(firma, await firmar(`${id}.${rol}.${expira}`))) return null;
  return { usuarioId, rol: rol as Rol };
}

/** Página de inicio de cada rol después de iniciar sesión */
export const INICIO_POR_ROL: Record<Rol, string> = { ADMIN: "/admin", EMPRENDEDOR: "/panel" };
