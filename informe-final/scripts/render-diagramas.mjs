// Renderiza los diagramas HTML de informe-final/diagramas a PNG (2x) con Playwright.
// Uso: PW=<ruta a playwright-core> node render-diagramas.mjs
import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { chromium } = createRequire(import.meta.url)(process.env.PW ?? "playwright-core");
const carpeta = join(import.meta.dirname, "..", "diagramas");
const navegador = await chromium.launch({ executablePath: process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 800 }, deviceScaleFactor: 2 });
for (const archivo of readdirSync(carpeta).filter((f) => f.endsWith(".html"))) {
  await pagina.goto(pathToFileURL(join(carpeta, archivo)).href);
  await pagina.waitForTimeout(300);
  const lienzo = await pagina.$("#lienzo");
  const salida = join(carpeta, archivo.replace(".html", ".png"));
  await lienzo.screenshot({ path: salida });
  console.log("✓", salida);
}
await navegador.close();
