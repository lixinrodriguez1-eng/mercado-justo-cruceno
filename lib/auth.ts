// =============================================================
// Sesión sencilla del administrador.
// Al iniciar sesión se guarda una cookie httpOnly con un token firmado
// (HMAC-SHA256) que incluye su fecha de expiración. Sin la clave
// AUTH_SECRET nadie puede fabricar un token válido.
// Usa Web Crypto, disponible tanto en las rutas API como en proxy.ts.
// =============================================================

export const COOKIE_ADMIN = "cafe_admin";
export const DURACION_SESION_SEG = 60 * 60 * 8; // 8 horas

const codificador = new TextEncoder();

function obtenerSecreto(): string {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto || secreto.length < 16)
    throw new Error("Falta AUTH_SECRET en .env (mínimo 16 caracteres).");
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

export async function crearToken(): Promise<string> {
  const expira = Date.now() + DURACION_SESION_SEG * 1000;
  return `${expira}.${await firmar(`admin.${expira}`)}`;
}

export async function tokenValido(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expira, firma] = token.split(".");
  if (!expira || !firma || Number(expira) < Date.now()) return false;
  return igualesSeguro(firma, await firmar(`admin.${expira}`));
}

export function contrasenaCorrecta(intento: string): boolean {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) throw new Error("Falta ADMIN_PASSWORD en .env");
  return igualesSeguro(intento, real);
}
