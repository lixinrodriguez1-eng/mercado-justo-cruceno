// =============================================================
// Auditoría Lighthouse en modo móvil con red 3G simulada.
// Uso:
//   node lighthouse-3g.mjs <fase>=<urlBase> [<fase>=<urlBase> ...]
//   ej. node lighthouse-3g.mjs antes=http://localhost:3006 despues=http://localhost:3005
// Requiere Lighthouse 12 (npm i lighthouse@12). Ruta del CLI en la variable LH_CLI.
//
// - 3 corridas por página y por versión; se informa la MEDIANA de cada métrica.
// - Si se pasan varias versiones, las corridas se INTERCALAN
//   (antes-1, después-1, antes-2, después-2…) para que el ruido de CPU del
//   equipo afecte por igual a las dos versiones y la comparación sea justa.
// - Throttling simulado: RTT 300 ms, 700 kbps de bajada, CPU 4× más lenta.
// =============================================================
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const versiones = process.argv.slice(2).map((a) => {
  const [fase, base] = a.split("=");
  return { fase, base: base ?? "http://localhost:3005" };
});
if (!versiones.length) versiones.push({ fase: "antes", base: "http://localhost:3005" });

// Ruta al CLI de Lighthouse (node_modules/lighthouse/cli/index.js)
const LH = process.env.LH_CLI ?? "node_modules/lighthouse/cli/index.js";
const CORRIDAS = 3;
const PAGINAS = [
  { nombre: "inicio", ruta: "/" },
  { nombre: "menu", ruta: "/menu" },
  { nombre: "carrito", ruta: "/carrito" },
];

const carpeta = (fase) => {
  const c = join(import.meta.dirname, "..", "resultados", fase);
  mkdirSync(c, { recursive: true });
  return c;
};
const mediana = (v) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)];

// Lighthouse falla de vez en cuando al grabar la traza (NO_NAVSTART):
// se reintenta hasta 3 veces la MISMA corrida, sin descartar resultados válidos.
function auditar(url, archivo, intento = 1) {
  try {
    return auditarUnaVez(url, archivo);
  } catch (error) {
    if (intento >= 3) throw error;
    console.log(`  ↻ reintento ${intento + 1}/3`);
    return auditar(url, archivo, intento + 1);
  }
}

function auditarUnaVez(url, archivo) {
  execFileSync(
    process.execPath,
    [
      LH,
      url,
      "--quiet",
      "--form-factor=mobile",
      "--screenEmulation.mobile",
      "--throttling-method=simulate",
      "--throttling.rttMs=300",
      "--throttling.throughputKbps=700",
      "--throttling.cpuSlowdownMultiplier=4",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      "--output=html",
      `--output-path=${archivo}`,
      "--chrome-flags=--headless=new --no-first-run --disable-extensions",
    ],
    { stdio: "inherit" },
  );
  const r = JSON.parse(readFileSync(`${archivo}.report.json`, "utf8"));
  const a = r.audits;
  return {
    rendimiento: Math.round(r.categories.performance.score * 100),
    accesibilidad: Math.round(r.categories.accessibility.score * 100),
    buenasPracticas: Math.round(r.categories["best-practices"].score * 100),
    seo: Math.round(r.categories.seo.score * 100),
    fcp: a["first-contentful-paint"].numericValue,
    lcp: a["largest-contentful-paint"].numericValue,
    tbt: a["total-blocking-time"].numericValue,
    cls: a["cumulative-layout-shift"].numericValue,
    si: a["speed-index"].numericValue,
    pesoKB: a["total-byte-weight"].numericValue / 1024,
    peticiones: a["network-requests"].details.items.length,
    jsKB: (a["resource-summary"].details.items.find((x) => x.resourceType === "script")?.transferSize ?? 0) / 1024,
    documentoKB: a["network-requests"].details.items[0].resourceSize / 1024,
  };
}

// corridas[fase][pagina] = [ {métricas}, ... ]
const corridas = Object.fromEntries(versiones.map((v) => [v.fase, Object.fromEntries(PAGINAS.map((p) => [p.nombre, []]))]));
for (let i = 1; i <= CORRIDAS; i++) {
  for (const pagina of PAGINAS) {
    for (const { fase, base } of versiones) {
      console.log(`→ corrida ${i}/${CORRIDAS} · ${pagina.ruta} · ${fase}`);
      corridas[fase][pagina.nombre].push(auditar(base + pagina.ruta, join(carpeta(fase), `${pagina.nombre}-${i}`)));
    }
  }
}

for (const { fase } of versiones) {
  const resumen = {};
  for (const pagina of PAGINAS) {
    const lista = corridas[fase][pagina.nombre];
    resumen[pagina.nombre] = Object.fromEntries(Object.keys(lista[0]).map((k) => [k, mediana(lista.map((c) => c[k]))]));
    // La corrida cuyo puntaje es la mediana se usa para las capturas
    const orden = lista.map((c, i) => ({ i: i + 1, s: c.rendimiento })).sort((x, y) => x.s - y.s);
    resumen[pagina.nombre].corridaMediana = orden[Math.floor(orden.length / 2)].i;
    resumen[pagina.nombre].corridas = lista;
  }
  writeFileSync(join(carpeta(fase), "resumen.json"), JSON.stringify(resumen, null, 2));
  console.log(`\n=== ${fase} (medianas de ${CORRIDAS} corridas) ===`);
  console.table(
    Object.fromEntries(
      Object.entries(resumen).map(([p, m]) => [
        p,
        {
          Perf: m.rendimiento,
          "FCP s": (m.fcp / 1000).toFixed(2),
          "LCP s": (m.lcp / 1000).toFixed(2),
          "TBT ms": Math.round(m.tbt),
          CLS: m.cls.toFixed(3),
          "SI s": (m.si / 1000).toFixed(2),
          KB: Math.round(m.pesoKB),
          Req: m.peticiones,
          "HTML KB": Math.round(m.documentoKB),
        },
      ]),
    ),
  );
}
