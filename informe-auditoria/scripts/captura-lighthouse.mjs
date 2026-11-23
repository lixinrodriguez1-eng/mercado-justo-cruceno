// =============================================================
// Captura los informes HTML de Lighthouse (corrida mediana de cada página)
// mostrando los puntajes y las métricas, para "antes" y "después".
// Uso: PUPPETEER_CORE=<ruta> node captura-lighthouse.mjs
// =============================================================
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const puppeteer = (await import(pathToFileURL(process.env.PUPPETEER_CORE).href)).default;
const resultados = join(import.meta.dirname, "..", "resultados");
const capturas = join(import.meta.dirname, "..", "capturas");

const navegador = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const pagina = await navegador.newPage();
await pagina.setViewport({ width: 900, height: 1200, deviceScaleFactor: 1.5 });

for (const fase of ["antes", "despues"]) {
  const resumen = JSON.parse(readFileSync(join(resultados, fase, "resumen.json"), "utf8"));
  for (const [nombre, datos] of Object.entries(resumen)) {
    // Corrida mediana (por puntaje) entre las 9 de las tres sesiones
    const html = join(resultados, `${datos.archivoMediano}.report.html`);
    await pagina.goto(pathToFileURL(html).href, { waitUntil: "networkidle0" });
    // Esperar a que termine la animación de los indicadores circulares
    // (si no, el número del puntaje aparece duplicado en la captura)
    await new Promise((r) => setTimeout(r, 4000));
    // El indicador grande queda en estado interactivo "peek/expanded", que
    // superpone una segunda etiqueta; se devuelve a su estado normal.
    await pagina.evaluate(() =>
      document.querySelectorAll(".lh-exp-gauge").forEach((g) => g.classList.remove("state--peek", "state--expanded", "state--highlight")),
    );
    await new Promise((r) => setTimeout(r, 1500));
    // Recorte: desde el encabezado con los 4 puntajes hasta el final de las métricas
    const zona = await pagina.evaluate(() => {
      const arriba = document.querySelector(".lh-scores-header, .lh-header-container") ?? document.body;
      const metricas = document.querySelector(".lh-metrics-container");
      const a = arriba.getBoundingClientRect();
      const m = metricas.getBoundingClientRect();
      return { x: 0, y: a.top + window.scrollY, width: document.documentElement.clientWidth, height: m.bottom - a.top + 16 };
    });
    await pagina.screenshot({ path: join(capturas, `lh-${fase}-${nombre}.png`), clip: zona });
    console.log("✓", `lh-${fase}-${nombre}.png`, "←", datos.archivoMediano);
  }
}
await navegador.close();
