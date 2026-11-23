// Captura de phpMyAdmin (XAMPP): ejecuta una consulta SELECT desde la pestaña
// SQL y guarda la pantalla, para demostrar que en MySQL los datos están limpios.
// Uso: PUPPETEER_CORE=<ruta> node captura-phpmyadmin.mjs
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const puppeteer = (await import(pathToFileURL(process.env.PUPPETEER_CORE).href)).default;
const capturas = join(import.meta.dirname, "..", "capturas");
const PMA = "http://localhost/phpmyadmin/";
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const navegador = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1.25 },
});
const pagina = await navegador.newPage();
// Si phpMyAdmin muestra un aviso, se registra y se cierra para no bloquear la prueba
pagina.on("dialog", async (d) => { console.log("aviso:", d.message()); await d.dismiss(); });

const consultas = [
  ["db-08-phpmyadmin-pedidos-limpios.png",
    "SELECT id, cliente, telefono, nota, total, fecha\nFROM pedidos\nORDER BY id DESC\nLIMIT 8;"],
  ["db-09-phpmyadmin-productos-limpios.png",
    "SELECT id, nombre, descripcion, precio, disponible\nFROM productos\nORDER BY id DESC\nLIMIT 6;"],
  ["db-10-phpmyadmin-busqueda-etiquetas.png",
    "-- ¿Queda alguna etiqueta HTML guardada en los campos de texto libre?\nSELECT 'pedidos' AS tabla, COUNT(*) AS filas_con_html FROM pedidos\n  WHERE cliente REGEXP '[<>]' OR nota REGEXP '[<>]'\nUNION ALL\nSELECT 'productos', COUNT(*) FROM productos\n  WHERE nombre REGEXP '[<>]' OR descripcion REGEXP '[<>]';"],
];

for (const [archivo, sql] of consultas) {
  await pagina.goto(`${PMA}index.php?route=/database/sql&db=cafeteria_db`, { waitUntil: "domcontentloaded", timeout: 30000 });
  // phpMyAdmin consulta el servidor periódicamente: esperamos al editor, no a "red inactiva"
  await pagina.waitForSelector("#button_submit_query", { timeout: 30000 });
  await esperar(1500);
  // El editor SQL de phpMyAdmin usa CodeMirror; se escribe la consulta en él
  await pagina.evaluate((q) => {
    document.querySelector("textarea[name=sql_query]").value = q;
    window.codeMirrorEditor?.setValue(q); // instancia global del editor de phpMyAdmin
  }, sql);
  await Promise.all([
    pagina.waitForResponse((r) => r.url().includes("index.php") && r.request().method() === "POST", { timeout: 15000 }).catch(() => {}),
    pagina.evaluate(() => document.querySelector("#button_submit_query").click()),
  ]);
  await esperar(2500);
  await pagina.screenshot({ path: join(capturas, archivo) });
  console.log("✓", archivo);
}
await navegador.close();
