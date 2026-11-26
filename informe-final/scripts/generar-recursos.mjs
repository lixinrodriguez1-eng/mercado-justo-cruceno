// Genera los recursos gráficos del informe y la presentación:
//  - recursos/qr-url.png: código QR que abre la URL pública
//  - recursos/icono-tienda.png: ícono de la plataforma (mismo SVG de la app)
// Uso: PW=<playwright-core> node generar-recursos.mjs
import { createRequire } from "node:module";
import { join } from "node:path";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode");
const { chromium } = require(process.env.PW ?? "playwright-core");
const URL_PUBLICA = process.env.URL_PUBLICA ?? "https://mercado-justo-cruceno.vercel.app";
const carpeta = join(import.meta.dirname, "..", "recursos");

await QRCode.toFile(join(carpeta, "qr-url.png"), URL_PUBLICA, {
  width: 900, margin: 2, errorCorrectionLevel: "H", color: { dark: "#2b1a12", light: "#ffffff" },
});

const html = `<body style="margin:0;background:transparent">
<div id="i" style="width:256px;height:256px;border-radius:50%;background:#3d2618;display:grid;place-items:center">
<svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="#f7efe3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
<path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>
<path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>
</svg></div></body>`;
const nav = await chromium.launch({ executablePath: process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await nav.newPage({ deviceScaleFactor: 2 });
await p.setContent(html);
await (await p.$("#i")).screenshot({ path: join(carpeta, "icono-tienda.png"), omitBackground: true });
await nav.close();
console.log("✓ recursos generados para", URL_PUBLICA);
