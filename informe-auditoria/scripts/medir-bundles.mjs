// =============================================================
// Mide el tamaño de los bundles de producción (.next/static).
// Uso:  node medir-bundles.mjs <fase> [urlBase]
// - Suma JS y CSS de todo el build (tamaño en disco y comprimido gzip).
// - Para cada ruta descarga el HTML y suma los <script>/<link> que pide,
//   así se ve cuánto JS descarga el navegador en cada página.
// - Para el panel admin inicia sesión con ADMIN_PASSWORD (variable de entorno).
// =============================================================
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const fase = process.argv[2] ?? "antes";
const base = process.argv[3] ?? "http://localhost:3005";
// Carpeta del proyecto cuyo build se mide (RAIZ permite medir la versión "antes")
const raiz = process.env.RAIZ ?? join(import.meta.dirname, "..", "..");
const estaticos = join(raiz, ".next", "static");

function recorrer(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? recorrer(p) : [p];
  });
}

const kb = (b) => Math.round((b / 1024) * 10) / 10;
const total = { js: { disco: 0, gzip: 0, archivos: 0 }, css: { disco: 0, gzip: 0, archivos: 0 } };
for (const archivo of recorrer(estaticos)) {
  const tipo = archivo.endsWith(".js") ? "js" : archivo.endsWith(".css") ? "css" : null;
  if (!tipo) continue;
  const contenido = readFileSync(archivo);
  total[tipo].disco += contenido.length;
  total[tipo].gzip += gzipSync(contenido).length;
  total[tipo].archivos++;
}

// Cookie de sesión del admin (para medir /admin y /admin/pedidos)
let cookie = "";
if (process.env.ADMIN_PASSWORD) {
  const r = await fetch(`${base}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
}

const rutas = ["/", "/menu", "/carrito", "/admin", "/admin/pedidos"];
const porRuta = {};
for (const ruta of rutas) {
  const html = await (await fetch(base + ruta, { headers: { cookie } })).text();
  const recursos = new Set(
    [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]),
  );
  let js = 0, jsGzip = 0, css = 0, cssGzip = 0;
  for (const url of recursos) {
    const contenido = readFileSync(join(raiz, ".next", url.replace("/_next/", "").split("?")[0]));
    if (url.endsWith(".js")) { js += contenido.length; jsGzip += gzipSync(contenido).length; }
    else { css += contenido.length; cssGzip += gzipSync(contenido).length; }
  }
  porRuta[ruta] = {
    htmlKB: kb(Buffer.byteLength(html)),
    htmlGzipKB: kb(gzipSync(html).length),
    jsKB: kb(js), jsGzipKB: kb(jsGzip), cssKB: kb(css), cssGzipKB: kb(cssGzip),
    archivos: recursos.size,
  };
}

const resultado = {
  build: {
    jsKB: kb(total.js.disco), jsGzipKB: kb(total.js.gzip), jsArchivos: total.js.archivos,
    cssKB: kb(total.css.disco), cssGzipKB: kb(total.css.gzip), cssArchivos: total.css.archivos,
  },
  porRuta,
};
const salida = join(import.meta.dirname, "..", "resultados", fase);
mkdirSync(salida, { recursive: true });
writeFileSync(join(salida, "bundles.json"), JSON.stringify(resultado, null, 2));
console.log("Build completo:", resultado.build);
console.table(porRuta);
