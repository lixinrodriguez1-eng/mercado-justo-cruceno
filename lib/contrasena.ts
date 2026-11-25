// =============================================================
// Contraseñas con bcrypt (OWASP A04:2025 Cryptographic Failures).
// bcrypt agrega una "sal" aleatoria a cada contraseña y es lento a
// propósito (costo 10 ≈ 1 024 rondas): si alguien roba la base de datos,
// adivinar cada contraseña por fuerza bruta le costaría muchísimo tiempo.
// Se usa bcryptjs (JavaScript puro) porque funciona igual en Windows,
// en Vercel y en cualquier servidor, sin compilar código nativo.
// =============================================================
import bcrypt from "bcryptjs";

const COSTO = 10;

export const hashearContrasena = (contrasena: string) => bcrypt.hash(contrasena, COSTO);

export const verificarContrasena = (contrasena: string, hash: string) => bcrypt.compare(contrasena, hash);

// Hash de una contraseña cualquiera: si el correo no existe se compara igual
// contra este hash, así el tiempo de respuesta no revela qué correos están
// registrados (enumeración de usuarios).
let hashFicticio: string | null = null;
export function obtenerHashFicticio(): string {
  hashFicticio ??= bcrypt.hashSync("contrasena-que-nadie-usa", COSTO);
  return hashFicticio;
}

export const MAX_INTENTOS = 5;
export const MINUTOS_BLOQUEO = 15;
