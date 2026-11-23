// =============================================================
// Registro de red con 3G REAL (throttling aplicado, no simulado).
// Uso: PUPPETEER_CORE=<ruta> node captura-red-3g.mjs antes=http://localhost:3006 despues=http://localhost:3005
// Usa el mismo protocolo que el panel Network de Chrome DevTools (CDP):
//   Network.emulateNetworkConditions → latencia 300 ms, 700 kbps, sin caché
//   Emulation.setCPUThrottlingRate   → CPU 4× más lenta
// Para cada versión carga /menu en un celular emulado, registra cada petición
// (tipo, tamaño transferido, inicio y fin) y mide FCP/LCP reales con
// PerformanceObserver. Luego dibuja la cascada (waterfall) y la captura.
// =============================================================
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const puppeteer = (await import(pathToFileURL(process.env.PUPPETEER_CORE).href)).default;
const versiones = process.argv.slice(2).map((a) => a.split("="));
const RUTA = process.env.RUTA ?? "/menu";
const capturas = join(import.meta.dirname, "..", "capturas");
const resultados = join(import.meta.dirname, "..", "resultados");
const navegador = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});

async function medir(url) {
  const contexto = await navegador.createBrowserContext(); // perfil limpio: sin caché ni carrito
  const pagina = await contexto.newPage();
  await pagina.setViewport({ width: 412, height: 823, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });
  const cdp = await pagina.createCDPSession();
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 300, // ms de ida y vuelta (RTT)
    downloadThroughput: (700 * 1024) / 8, // 700 kbps en bytes/s
    uploadThroughput: (700 * 1024) / 8,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  const peticiones = new Map();
  cdp.on("Network.requestWillBeSent", (e) =>
    peticiones.set(e.requestId, { url: e.request.url, inicio: e.timestamp, tipo: e.type }),
  );
  cdp.on("Network.responseReceived", (e) => {
    const p = peticiones.get(e.requestId);
    if (p) { p.tipo = e.type; p.estado = e.response.status; p.respuesta = e.timestamp; }
  });
  cdp.on("Network.loadingFinished", (e) => {
    const p = peticiones.get(e.requestId);
    if (p) { p.fin = e.timestamp; p.bytes = e.encodedDataLength; }
  });
  await pagina.evaluateOnNewDocument(() => {
    window.__lcp = 0;
    new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__lcp = e.startTime))).observe({
      type: "largest-contentful-paint",
      buffered: true,
    });
  });

  await pagina.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1500));
  const tiempos = await pagina.evaluate(() => ({
    fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0,
    lcp: window.__lcp,
    load: performance.getEntriesByType("navigation")[0]?.loadEventEnd ?? 0,
  }));
  await contexto.close();

  const lista = [...peticiones.values()].filter((p) => p.fin && !p.url.startsWith("data:"));
  const t0 = Math.min(...lista.map((p) => p.inicio));
  return {
    url,
    tiempos,
    totalKB: lista.reduce((s, p) => s + p.bytes, 0) / 1024,
    peticiones: lista
      .map((p) => ({
        nombre: decodeURIComponent(new URL(p.url).pathname.split("/").pop() || new URL(p.url).pathname) +
          (p.url.includes("/_next/image") ? " (" + (new URL(p.url).searchParams.get("w") ?? "") + "w)" : ""),
        tipo: p.tipo,
        kb: p.bytes / 1024,
        inicio: (p.inicio - t0) * 1000,
        fin: (p.fin - t0) * 1000,
      }))
      .sort((a, b) => a.inicio - b.inicio),
  };
}

const COLORES = { Document: "#3d2618", Script: "#b9471c", Stylesheet: "#7a5cff", Font: "#2f6b3a", Image: "#e0a030", Fetch: "#888", Other: "#aaa" };
function cascada(fase, m) {
  const max = Math.max(...m.peticiones.map((p) => p.fin), m.tiempos.lcp) * 1.03;
  const filas = m.peticiones.map((p) => `
    <tr><td class="n">${p.nombre.slice(0, 34)}</td><td>${p.tipo}</td><td class="r">${p.kb.toFixed(1)} KB</td>
    <td class="r">${Math.round(p.fin - p.inicio)} ms</td>
    <td class="w"><div class="b" style="left:${(p.inicio / max) * 100}%;width:${Math.max(((p.fin - p.inicio) / max) * 100, 0.4)}%;background:${COLORES[p.tipo] ?? "#aaa"}"></div></td></tr>`).join("");
  const marca = (t, c, txt) => `<div class="m" style="left:${(t / max) * 100}%;border-color:${c}"><span style="color:${c}">${txt}</span></div>`;
  return `<!doctype html><meta charset="utf-8"><style>
  body{font:12px/1.35 Segoe UI,Arial;margin:0;padding:16px 18px;background:#fff;color:#222}
  h1{font-size:16px;margin:0 0 4px} .s{color:#555;margin-bottom:10px}
  table{border-collapse:collapse;width:100%} td{padding:2px 6px;border-bottom:1px solid #eee;white-space:nowrap}
  th{text-align:left;font-weight:600;background:#f3f3f3;padding:4px 6px;border-bottom:1px solid #ccc}
  .n{max-width:230px;overflow:hidden;text-overflow:ellipsis}.r{text-align:right}
  .w{width:52%;position:relative;padding:0}.b{position:absolute;top:4px;height:10px;border-radius:2px}
  .eje{position:relative;height:18px}.m{position:absolute;top:0;bottom:0;border-left:2px dashed}
  .m span{position:absolute;top:0;left:4px;font-weight:700;white-space:nowrap}
  .wrap{position:relative}.ov{position:absolute;top:0;bottom:0;right:0;width:52%;pointer-events:none}
  .pie{margin-top:8px;color:#333;font-weight:600}</style>
  <h1>Red ${{ antes: "ANTES", despues: "DESPUÉS" }[fase] ?? fase.toUpperCase()} · ${RUTA} · Chrome con 3G aplicado (RTT 300 ms, 700 kbps, CPU 4×, sin caché)</h1>
  <div class="s">Registro de red obtenido con Chrome DevTools Protocol (mismo origen de datos que el panel Network de DevTools)</div>
  <div class="wrap"><table><tr><th>Nombre</th><th>Tipo</th><th class="r">Transferido</th><th class="r">Tiempo</th><th>Cascada (0 – ${(max / 1000).toFixed(1)} s)</th></tr>${filas}</table>
  <div class="ov">${
    // Si FCP y LCP coinciden, una sola marca para que las etiquetas no se encimen
    Math.abs(m.tiempos.lcp - m.tiempos.fcp) < 50
      ? marca(m.tiempos.lcp, "#b42318", "FCP = LCP " + (m.tiempos.lcp / 1000).toFixed(2) + " s")
      : marca(m.tiempos.fcp, "#2f6b3a", "FCP " + (m.tiempos.fcp / 1000).toFixed(2) + " s") + marca(m.tiempos.lcp, "#b42318", "LCP " + (m.tiempos.lcp / 1000).toFixed(2) + " s")
  }</div></div>
  <div class="pie">${m.peticiones.length} peticiones · ${m.totalKB.toFixed(0)} KB transferidos · FCP ${(m.tiempos.fcp / 1000).toFixed(2)} s · LCP ${(m.tiempos.lcp / 1000).toFixed(2)} s · load ${(m.tiempos.load / 1000).toFixed(2)} s</div>`;
}

const todo = {};
for (const [fase, base] of versiones) {
  const corridas = [];
  for (let i = 0; i < 3; i++) corridas.push(await medir(base + RUTA)); // 3 cargas, se usa la mediana por LCP
  corridas.sort((a, b) => a.tiempos.lcp - b.tiempos.lcp);
  const m = corridas[1];
  todo[fase] = { mediana: m, lcps: corridas.map((c) => c.tiempos.lcp), fcps: corridas.map((c) => c.tiempos.fcp) };
  const archivoHtml = join(resultados, `red-3g-${fase}.html`);
  writeFileSync(archivoHtml, cascada(fase, m));
  const p = await navegador.newPage();
  await p.setViewport({ width: 1280, height: 600, deviceScaleFactor: 1.5 });
  await p.goto(pathToFileURL(archivoHtml).href);
  await p.screenshot({ path: join(capturas, `red-3g-${fase}${RUTA.replace(/\//g, "-")}.png`), fullPage: true });
  await p.close();
  console.log(fase, `${m.peticiones.length} peticiones, ${m.totalKB.toFixed(0)} KB, FCP ${m.tiempos.fcp.toFixed(0)} ms, LCP ${m.tiempos.lcp.toFixed(0)} ms (LCPs: ${todo[fase].lcps.map(Math.round).join(", ")})`);
}
writeFileSync(join(resultados, `red-3g${RUTA.replace(/\//g, "-")}.json`), JSON.stringify(todo, null, 2));
await navegador.close();
