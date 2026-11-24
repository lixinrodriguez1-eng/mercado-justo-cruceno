// =============================================================
// Figura de clickjacking: un "sitio atacante" (otro origen) intenta
// incrustar la tienda en un iframe, ANTES (puerto 3006, sin cabeceras)
// y DESPUÉS (puerto 3005, con frame-ancestors 'none' y X-Frame-Options: DENY).
// Muestra, además, las cabeceras reales de cada respuesta y el mensaje
// que Chrome escribe en la consola al bloquear el iframe.
// Uso: PUPPETEER_CORE=<ruta a puppeteer-core> node captura-clickjacking.mjs
// =============================================================
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const puppeteer = (await import(pathToFileURL(process.env.PUPPETEER_CORE).href)).default;
const ANTES = "http://localhost:3006";
const DESPUES = "http://localhost:3005";
const capturas = join(import.meta.dirname, "..", "capturas");
const resultados = join(import.meta.dirname, "..", "resultados");

// Cabeceras reales que devuelve cada versión para la página de inicio
async function cabeceras(url) {
  const r = await fetch(url + "/");
  return {
    xfo: r.headers.get("x-frame-options") ?? "(no se envía)",
    fa: (r.headers.get("content-security-policy") ?? "").match(/frame-ancestors [^;]+/)?.[0] ?? "(no se envía)",
  };
}
const ca = await cabeceras(ANTES);
const cd = await cabeceras(DESPUES);

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const columna = (titulo, color, url, c, resultado) => `
  <div class="col">
    <div class="etq" style="background:${color}">${titulo}</div>
    <iframe src="${url}/" title="${titulo}"></iframe>
    <div class="cab">X-Frame-Options: <b>${esc(c.xfo)}</b><br>Content-Security-Policy: <b>${esc(c.fa)}</b></div>
    <div class="res" style="color:${color}">${resultado}</div>
  </div>`;

const html = `<!doctype html><meta charset="utf-8"><title>Sitio del atacante</title>
<style>
  body{margin:0;padding:22px 26px;background:#fdecea;font-family:Segoe UI,Arial,sans-serif;color:#2b1d16}
  h1{font-size:21px;margin:0 0 4px} .sub{font-size:14px;color:#6b4f43;margin-bottom:16px}
  .fila{display:flex;gap:22px} .col{flex:1}
  .etq{color:#fff;font-weight:700;font-size:15px;padding:7px 12px;border-radius:8px 8px 0 0}
  iframe{display:block;width:100%;height:430px;border:3px dashed #b42318;border-top:0;background:#fff;box-sizing:border-box}
  .cab{font:12.5px/1.6 Consolas,monospace;background:#fff;border:1px solid #e3c9c3;border-radius:6px;padding:8px 10px;margin-top:10px}
  .res{font-weight:700;font-size:15px;margin-top:8px}
  .consola{margin-top:16px;background:#1e1e1e;color:#f48771;font:12.5px/1.5 Consolas,monospace;padding:12px 14px;border-radius:8px}
  .consola b{color:#fff}
</style>
<h1>Sitio del atacante (otro origen) intentando incrustar Café Chiquitano en un iframe</h1>
<div class="sub">Misma página atacante, dos versiones de la tienda: la original y la protegida.</div>
<div class="fila">
  ${columna("ANTES · versión original (puerto 3006)", "#b42318", ANTES, ca, "✗ La tienda se muestra dentro del sitio ajeno: clickjacking posible")}
  ${columna("DESPUÉS · versión protegida (puerto 3005)", "#2e7d32", DESPUES, cd, "✓ El navegador se niega a mostrarla: clickjacking bloqueado")}
</div>
<div class="consola" id="consola"><b>Consola de Chrome</b><br>(esperando mensajes…)</div>`;

const archivo = join(resultados, "sitio-atacante-iframe.html");
writeFileSync(archivo, html);

const navegador = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  defaultViewport: { width: 1360, height: 800, deviceScaleFactor: 1.5 },
  args: ["--lang=es-BO"],
});
const pagina = await navegador.newPage();
// Mensajes reales de la consola (Chrome registra el bloqueo del iframe como error)
const consola = [];
const cdp = await pagina.createCDPSession();
await cdp.send("Log.enable");
cdp.on("Log.entryAdded", ({ entry }) => consola.push(entry.text));
pagina.on("console", (m) => consola.push(m.text()));

await pagina.goto(pathToFileURL(archivo).href, { waitUntil: "networkidle0" }).catch(() => {});
await new Promise((r) => setTimeout(r, 2500));

const relevantes = [...new Set(consola.filter((t) => /frame|ancestor/i.test(t)))];
console.log("Mensajes de consola sobre el iframe:\n" + relevantes.join("\n"));
await pagina.evaluate((msgs) => {
  document.getElementById("consola").innerHTML =
    "<b>Consola de Chrome (mensajes reales al cargar esta página)</b><br>" +
    (msgs.length ? msgs.map((m) => "⛔ " + m.replace(/&/g, "&amp;").replace(/</g, "&lt;")).join("<br>") : "(sin mensajes)");
}, relevantes);

const alto = await pagina.evaluate(() => document.body.scrollHeight + 10);
await pagina.setViewport({ width: 1360, height: alto, deviceScaleFactor: 1.5 });
await pagina.screenshot({ path: join(capturas, "csp-07-clickjacking-bloqueado.png") });
console.log("✓ csp-07-clickjacking-bloqueado.png");
await navegador.close();
