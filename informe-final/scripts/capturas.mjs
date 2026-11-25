// =============================================================
// Capturas reales de cada funcionalidad (Playwright + Chrome instalado).
// Recorre el flujo completo como lo haría una persona: catálogo → carrito →
// compra real → confirmación; panel del emprendedor; panel del administrador.
//
// Uso:
//   PW=<ruta a playwright-core> BASE=https://... ADMIN_PASS=... EMP_PASS=... \
//   node capturas.mjs <carpeta-salida> [prefijo]
// =============================================================
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW ?? "playwright-core");

const BASE = (process.env.BASE ?? "http://localhost:3200").replace(/\/$/, "");
const SALIDA = process.argv[2] ?? "capturas";
const PREFIJO = process.argv[3] ?? "";
mkdirSync(SALIDA, { recursive: true });

const navegador = await chromium.launch({
  executablePath: process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});

async function captura(pagina, nombre, opciones = {}) {
  await pagina.waitForLoadState("networkidle").catch(() => {});
  // Espera a que las imágenes visibles terminen de cargar
  await pagina.evaluate(async () => {
    const imgs = [...document.images].filter((i) => i.loading !== "lazy" || i.getBoundingClientRect().top < innerHeight);
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => ((i.onload = r), (i.onerror = r))))));
  });
  await pagina.waitForTimeout(400);
  const archivo = join(SALIDA, `${PREFIJO}${nombre}.png`);
  await pagina.screenshot({ path: archivo, ...opciones });
  console.log("📸", archivo);
}

// ---------- Escritorio: tienda ----------
const escritorio = await navegador.newContext({ viewport: { width: 1366, height: 860 }, locale: "es-BO" });
const p = await escritorio.newPage();
await p.goto(BASE + "/");
await captura(p, "01-inicio");
await p.evaluate(() => document.getElementById("como-funciona")?.scrollIntoView());
await captura(p, "02-inicio-como-funciona");
await p.evaluate(() => document.getElementById("ods")?.scrollIntoView());
await captura(p, "03-inicio-ods");

await p.goto(BASE + "/catalogo");
await captura(p, "04-catalogo");
await p.selectOption("#filtro-barrio", "plan-3000");
await captura(p, "05-catalogo-filtro-barrio");
await p.goto(BASE + "/catalogo?rubro=artesania");
await captura(p, "06-catalogo-filtro-rubro");

await p.goto(BASE + "/emprendedores");
await captura(p, "07-emprendedores");
await p.goto(BASE + "/emprendedores/cafe-chiquitano");
await captura(p, "08-emprendedor-cafe-chiquitano");
await p.evaluate(() => document.getElementById("titulo-productos")?.scrollIntoView());
await captura(p, "09-emprendedor-productos");

// ---------- Compra real con productos de 2 emprendedores ----------
await p.goto(BASE + "/emprendedores/cafe-chiquitano");
await p.getByRole("button", { name: /Agregar Capuchino/ }).click();
await p.getByRole("button", { name: /Agregar Café de los Yungas/ }).click();
await p.goto(BASE + "/emprendedores/huerta-familiar-los-lotes");
await p.getByRole("button", { name: /Agregar Canasta de verduras/ }).click();
await p.goto(BASE + "/carrito");
await p.fill("#cliente", "Valeria Suárez");
await p.fill("#telefono", "76543210");
await p.fill("#nota", "Entregar después de las 18:00");
await captura(p, "10-carrito");
await p.getByRole("button", { name: "Confirmar pedido" }).click();
await p.waitForURL(/\/pedido\//, { timeout: 30000 });
await p.getByText("Coordinar entrega por WhatsApp").first().waitFor();
await captura(p, "11-confirmacion");
await captura(p, "12-confirmacion-completa", { fullPage: true });
const urlConfirmacion = p.url();

await p.goto(BASE + "/registro");
await captura(p, "13-registro");
await p.goto(BASE + "/ingresar");
await captura(p, "14-ingresar");

// ---------- Panel del emprendedor ----------
async function ingresar(contexto, email, password) {
  const pg = await contexto.newPage();
  await pg.goto(BASE + "/ingresar");
  await pg.fill("#email", email);
  await pg.fill("#password", password);
  await pg.getByRole("button", { name: "Ingresar" }).click();
  await pg.waitForURL(/\/(panel|admin)/, { timeout: 30000 });
  return pg;
}
const ctxEmp = await navegador.newContext({ viewport: { width: 1366, height: 860 }, locale: "es-BO" });
const emp = await ingresar(ctxEmp, "cafechiquitano@mercadojusto.test", process.env.EMP_PASS);
await captura(emp, "15-panel-productos");
await emp.getByRole("button", { name: "Nuevo producto" }).click();
await emp.getByRole("dialog").waitFor();
await emp.fill("#p-nombre", "Mocochinchi helado");
await emp.fill("#p-precio", "10");
await captura(emp, "16-panel-nuevo-producto");
await emp.keyboard.press("Escape");
await emp.goto(BASE + "/panel/pedidos");
await captura(emp, "17-panel-pedidos");
const boton = emp.getByRole("button", { name: "Empezar a preparar" }).first();
if (await boton.count()) {
  await boton.click();
  await emp.waitForTimeout(800);
  await captura(emp, "18-panel-pedido-preparando");
}
await emp.goto(BASE + "/panel/perfil");
await captura(emp, "19-panel-perfil");

// ---------- Panel del administrador ----------
const ctxAdm = await navegador.newContext({ viewport: { width: 1366, height: 860 }, locale: "es-BO" });
const adm = await ingresar(ctxAdm, "admin@mercadojusto.test", process.env.ADMIN_PASS);
await adm.getByRole("button", { name: /Todos/ }).first().click();
await captura(adm, "20-admin-emprendedores");
await adm.goto(BASE + "/admin/pedidos");
await captura(adm, "21-admin-pedidos");
await adm.goto(BASE + "/admin/productos");
await captura(adm, "22-admin-productos");

// El cliente ve el cambio de estado que hizo el emprendedor
await p.goto(urlConfirmacion);
await captura(p, "23-confirmacion-estado-actualizado");

// ---------- Móvil ----------
const movil = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "es-BO",
});
const m = await movil.newPage();
await m.goto(BASE + "/");
await captura(m, "24-movil-inicio");
await m.goto(BASE + "/catalogo");
await captura(m, "25-movil-catalogo");
await m.goto(BASE + "/emprendedores/barro-y-palma");
await captura(m, "26-movil-emprendedor");

await navegador.close();
console.log("URL de la compra de prueba:", urlConfirmacion);
