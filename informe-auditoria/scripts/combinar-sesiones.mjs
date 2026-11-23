// =============================================================
// Combina las sesiones de Lighthouse (s1, s2, s3), cada una con 3 corridas
// intercaladas por página y versión (el mismo protocolo de la Fase 1).
// Escribe resultados/antes/resumen.json y resultados/despues/resumen.json con:
//   - la mediana global de las 9 corridas de cada métrica,
//   - la mediana de cada sesión (para mostrar la variación entre sesiones),
//   - la corrida mediana (por puntaje) para las capturas.
// Uso: node combinar-sesiones.mjs
// =============================================================
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RES = join(import.meta.dirname, "..", "resultados");
const SESIONES = ["s1", "s2", "s3"].filter((s) => existsSync(join(RES, s, "antes", "resumen.json")));
const mediana = (v) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)];

for (const fase of ["antes", "despues"]) {
  const salida = {};
  const porSesion = SESIONES.map((s) => ({ s, r: JSON.parse(readFileSync(join(RES, s, fase, "resumen.json"), "utf8")) }));
  for (const pagina of ["inicio", "menu", "carrito"]) {
    // Todas las corridas con su archivo de origen
    const corridas = porSesion.flatMap(({ s, r }) =>
      r[pagina].corridas.map((c, i) => ({ ...c, archivo: `${s}/${fase}/${pagina}-${i + 1}` })),
    );
    const claves = Object.keys(corridas[0]).filter((k) => typeof corridas[0][k] === "number");
    salida[pagina] = Object.fromEntries(claves.map((k) => [k, mediana(corridas.map((c) => c[k]))]));
    const orden = [...corridas].sort((a, b) => a.rendimiento - b.rendimiento);
    salida[pagina].archivoMediano = orden[Math.floor(orden.length / 2)].archivo;
    salida[pagina].numCorridas = corridas.length;
    salida[pagina].sesiones = porSesion.map(({ s, r }) => ({
      sesion: s,
      ...Object.fromEntries(["rendimiento", "fcp", "lcp", "tbt", "cls", "si", "pesoKB", "peticiones"].map((k) => [k, r[pagina][k]])),
    }));
    salida[pagina].corridas = corridas;
  }
  mkdirSync(join(RES, fase), { recursive: true });
  writeFileSync(join(RES, fase, "resumen.json"), JSON.stringify(salida, null, 2));
}

const A = JSON.parse(readFileSync(join(RES, "antes", "resumen.json"), "utf8"));
const D = JSON.parse(readFileSync(join(RES, "despues", "resumen.json"), "utf8"));
console.log(`Sesiones combinadas: ${SESIONES.join(", ")} (${A.inicio.numCorridas} corridas por página y versión)`);
const tabla = {};
for (const p of ["inicio", "menu", "carrito"])
  for (const [k, f] of [["rendimiento", (x) => x], ["fcp", (x) => (x / 1000).toFixed(2)], ["lcp", (x) => (x / 1000).toFixed(2)], ["tbt", Math.round], ["cls", (x) => x.toFixed(3)], ["si", (x) => (x / 1000).toFixed(2)], ["pesoKB", Math.round], ["peticiones", (x) => x]])
    tabla[`${p} · ${k}`] = { antes: f(A[p][k]), despues: f(D[p][k]), "sesiones antes": A[p].sesiones.map((s) => f(s[k])).join(" / "), "sesiones después": D[p].sesiones.map((s) => f(s[k])).join(" / ") };
console.table(tabla);
