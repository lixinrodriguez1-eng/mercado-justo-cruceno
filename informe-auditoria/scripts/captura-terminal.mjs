// =============================================================
// Convierte salidas REALES de comandos (guardadas en resultados/*.txt) en
// imágenes con aspecto de terminal, para insertarlas en el informe.
// Uso: PUPPETEER_CORE=<ruta> node captura-terminal.mjs
// Cada entrada: [imagen de salida, título de la ventana, [ [comando, archivo.txt], ... ] ]
// =============================================================
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const puppeteer = (await import(pathToFileURL(process.env.PUPPETEER_CORE).href)).default;
const resultados = join(import.meta.dirname, "..", "resultados");
const capturas = join(import.meta.dirname, "..", "capturas");

const TERMINALES = [
  ["term-01-cabeceras-antes-despues.png", "Terminal — cabeceras HTTP de la página de inicio", [
    ["curl -I http://localhost:3006/   # ANTES", "cabeceras-antes.txt"],
    ["curl -I http://localhost:3005/   # DESPUÉS", "cabeceras-despues.txt"],
  ]],
  ["term-02-npm-audit-antes-despues.png", "Terminal — npm audit (cadena de suministro, OWASP A03:2025)", [
    ["npm audit   # ANTES (22/11/2026)", "npm-audit-antes.txt"],
    ["npm audit   # DESPUÉS, overrides en package.json (22/11/2026)", "npm-audit-despues.txt"],
  ]],
  ["term-03-build-produccion.png", "Terminal — npm run build (versión optimizada)", [["npm run build", "build-despues.txt"]]],
  ["term-04-minificacion.png", "Terminal — evidencia de minificación del bundle", [["node medir-bundles.mjs / head -c 400 chunk.js", "minificacion.txt"]]],
  ["term-05-pruebas-ataque-api.png", "Terminal — pruebas de ataque XSS e inyección SQL contra la API", [["node prueba-ataques.mjs", "prueba-ataques.txt"]]],
  ["term-06-prueba-unitaria-xss.png", "Terminal — prueba unitaria de limpiarTexto() (lib/validacion.ts)", [["npx tsx prueba-xss-unitaria.ts", "prueba-xss-unitaria.txt"]]],
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// Resalta lo importante para que se lea en la figura
const resaltar = (s) =>
  esc(s)
    .replace(/(Content-Security-Policy|X-Content-Type-Options|Referrer-Policy|X-Frame-Options|Permissions-Policy|Cross-Origin-Opener-Policy|Strict-Transport-Security)(:)/g, '<b style="color:#6ee7a0">$1</b>$2')
    .replace(/(X-Powered-By: Next.js)/g, '<b style="color:#ff8a80">$1</b>')
    .replace(/(\d+ high severity vulnerabilities|Severity: high)/g, '<b style="color:#ff8a80">$1</b>')
    .replace(/(found 0 vulnerabilities)/g, '<b style="color:#6ee7a0">$1</b>')
    .replace(/(→ 4\d\d[^\n]*)/g, '<span style="color:#ffd479">$1</span>')
    .replace(/(→ 201[^\n]*)/g, '<span style="color:#6ee7a0">$1</span>');

const navegador = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const pagina = await navegador.newPage();
await pagina.setViewport({ width: 1200, height: 400, deviceScaleFactor: 1.5 });
for (const [archivo, titulo, bloques] of TERMINALES) {
  if (bloques.some(([, f]) => !existsSync(join(resultados, f)))) { console.log("× falta texto para", archivo); continue; }
  const cuerpo = bloques
    .map(([cmd, f]) => `<div class="cmd">cafeteria-web $${esc(cmd)}</div><pre>${resaltar(readFileSync(join(resultados, f), "utf8").trimEnd())}</pre>`)
    .join("");
  await pagina.setContent(`<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#fff;padding:14px}
    .v{border-radius:8px;overflow:hidden;box-shadow:0 4px 18px #0003;max-width:1170px}
    .t{background:#2d2d30;color:#ddd;font:13px Segoe UI,Arial;padding:7px 12px}
    .c{background:#0c0c0c;color:#cccccc;padding:10px 14px;font:13px/1.45 Consolas,'Cascadia Mono',monospace}
    .cmd{color:#f9f1a5;margin-top:6px} pre{margin:2px 0 10px;white-space:pre-wrap;word-break:break-all;font:inherit}
  </style><div class="v"><div class="t">${esc(titulo)}</div><div class="c">${cuerpo}</div></div>`);
  const v = await pagina.$(".v");
  await v.screenshot({ path: join(capturas, archivo) });
  console.log("✓", archivo);
}
await navegador.close();
