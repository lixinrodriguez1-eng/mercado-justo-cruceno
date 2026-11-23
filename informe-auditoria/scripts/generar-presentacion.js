// =============================================================
// Genera la presentación de la auditoría (PowerPoint) con pptxgenjs.
// Uso: NODE_PATH=<node_modules con pptxgenjs> node generar-presentacion.js
// Mismo estilo que la presentación de la entrega anterior (café / crema /
// terracota, títulos Cambria, agenda con tarjetas clicables) y datos reales
// leídos de informe-auditoria/resultados.
// =============================================================
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const AUD = path.join(__dirname, "..");
const RES = path.join(AUD, "resultados");
const CAP = path.join(AUD, "capturas");
const leer = (p) => JSON.parse(fs.readFileSync(path.join(RES, p), "utf8"));
const ANTES = leer("antes/resumen.json"), DESPUES = leer("despues/resumen.json");
const B_A = leer("antes/bundles.json"), B_D = leer("despues/bundles.json");
const NAV = leer("prueba-navegador.json");
const INICIAL = leer("fase1-inicial/resumen.json"); // línea base de la Fase 1
const SALIDA = path.join(AUD, "Presentacion_Auditoria_WPO_OWASP.pptx");
const RED = leer("red-3g-menu.json");
// % del LCP del inicio que fue "Render Delay" en la corrida mediana de la Fase 1
const RETRASO_LCP = leer(`fase1-inicial/inicio-${INICIAL.inicio.corridaMediana}.report.json`)
  .audits["largest-contentful-paint-element"].details.items[1].items.find((f) => f.phase === "Render Delay").percent.replace("%", " %");
// En cuántas sesiones el TBT del "después" fue menor que el del "antes"
const SES_TBT = Object.fromEntries(["inicio", "menu", "carrito"].map((k) => [k, ANTES[k].sesiones.filter((a, i) => DESPUES[k].sesiones[i].tbt < a.tbt).length]));
const N_SES = ANTES.inicio.sesiones.length;
const imgKB = (f) => RED[f].mediana.peticiones.filter((x) => /image/i.test(x.tipo)).reduce((t, x) => t + x.kb, 0);

const THEME = {
  name: "Cafe Chiquitano",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "2B1A12", lt1: "FFFFFF", dk2: "3D2618", lt2: "F7EFE3",
    accent1: "B9471C", accent2: "E3CBAB", accent3: "2F6B3A", accent4: "B98E70",
    accent5: "E07A45", accent6: "6F4630", hlink: "B9471C", folHlink: "9C3A15",
  },
};
const HEX = THEME.colors;

// ---------- utilidades ----------
const num = (x, d = 2) => x.toFixed(d).replace(".", ",");
const seg = (ms) => num(ms / 1000) + " s";
const pct = (a, b) => Math.round(((b - a) / a) * 100);
function tamPng(archivo) {
  const b = fs.readFileSync(archivo);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
/** Imagen ajustada dentro de una caja, sin deformarla */
function imagen(slide, archivo, x, y, w, h, extra = {}) {
  const ruta = path.join(CAP, archivo);
  const { w: iw, h: ih } = tamPng(ruta);
  const escala = Math.min(w / iw, h / ih);
  const ww = iw * escala, hh = ih * escala;
  slide.addImage({ path: ruta, x: x + (w - ww) / 2, y: y + (h - hh) / 2, w: ww, h: hh, ...extra });
  return { x: x + (w - ww) / 2, y: y + (h - hh) / 2, w: ww, h: hh };
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE"; // 13,33 × 7,5 pulgadas, igual que la entrega anterior
  pres.title = "Taller de Auditoría, Optimización WPO y Seguridad Frontend (OWASP): Café Chiquitano";
  pres.author = "Ismael Franco Ruíz; Lizeth Adela Rodríguez Padilla";
  pres.subject = "Diseño Web II – UPDS";
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;
  const ICONO = path.join(__dirname, "recursos", "icono-taza.png");

  // ---------- Layouts ----------
  pres.defineSlideMaster({
    title: "Contenido",
    background: { color: "FFFFFF" },
    objects: [
      { rect: { x: 0.5, y: 0.42, w: 0.62, h: 0.62, fill: { color: C.text2 }, rectRadius: 0.12 } },
      { image: { path: ICONO, x: 0.6, y: 0.52, w: 0.42, h: 0.42 } },
      { text: { text: "Café Chiquitano · Diseño Web II · UPDS · Auditoría WPO/OWASP", options: { x: 0.5, y: 7.0, w: 6, h: 0.3, fontSize: 9, color: C.accent1, margin: 0 } } },
      // Marcador del título (pptxgenjs 3.12 solo lee los placeholders dentro de `objects`)
      { placeholder: { options: { name: "title", type: "title", x: 1.35, y: 0.38, w: 11.4, h: 0.72, fontSize: 32, bold: true, color: C.text1, fontFace: "Cambria", valign: "middle", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: 12.4, y: 7.0, w: 0.5, h: 0.3, fontSize: 9, color: C.accent4, align: "right" },
  });
  pres.defineSlideMaster({ title: "Oscuro", background: { color: C.text1 }, objects: [] });

  const secciones = {};
  function nueva(titulo, seccion) {
    if (!secciones[seccion]) { pres.addSection({ title: seccion }); secciones[seccion] = true; }
    const s = pres.addSlide({ masterName: "Contenido", sectionTitle: seccion });
    s.addText(titulo, { placeholder: "title" });
    // Enlace para volver a la agenda (igual que en la presentación anterior)
    s.addText("⌂ Volver a la agenda", { x: 10.3, y: 7.0, w: 2.0, h: 0.3, fontSize: 9, color: C.accent1, underline: true, align: "right", margin: 0, isTextBox: true, hyperlink: { slide: 2 }, objectName: "volver-agenda" });
    return s;
  }
  // Tarjeta crema con número grande (estadística)
  function cifra(s, x, y, w, h, valor, etiqueta, detalle, oscuro = false) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: oscuro ? C.text2 : C.background2 }, rectRadius: 0.1, line: { type: "none" } });
    s.addText(valor, { x, y: y + 0.12, w, h: h * 0.48, fontFace: "Cambria", fontSize: 34, bold: true, color: oscuro ? HEX.accent5 : C.accent1, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText([
      { text: etiqueta, options: { bold: true, fontSize: 13, color: oscuro ? "FFFFFF" : C.text1, breakLine: true } },
      { text: detalle, options: { fontSize: 10.5, color: oscuro ? HEX.accent2 : C.accent6 } },
    ], { x: x + 0.15, y: y + h * 0.55, w: w - 0.3, h: h * 0.42, align: "center", valign: "top", margin: 0, isTextBox: true });
  }
  function tarjeta(s, x, y, w, h, titulo, cuerpo, opciones = {}) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: opciones.oscuro ? C.text2 : C.background2 }, rectRadius: 0.1, line: { type: "none" } });
    s.addText(titulo, { x: x + 0.25, y: y + 0.18, w: w - 0.5, h: 0.45, fontFace: "Cambria", fontSize: 18, bold: true, color: opciones.oscuro ? "FFFFFF" : C.text1, margin: 0, isTextBox: true });
    s.addText(cuerpo, { x: x + 0.25, y: y + 0.7, w: w - 0.5, h: h - 0.85, fontSize: 14, color: opciones.oscuro ? HEX.accent2 : C.text2, valign: "top", margin: 0, paraSpaceAfter: 6, isTextBox: true });
  }
  const viñetas = (items) => items.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < items.length - 1 } }));
  const celda = (t, o = {}) => ({ text: String(t), options: o });
  const ENC = { bold: true, color: "FFFFFF", fill: { color: HEX.dk2 } };

  // =========================================================
  // 1. Portada
  // =========================================================
  pres.addSection({ title: "Inicio" });
  let s = pres.addSlide({ masterName: "Oscuro", sectionTitle: "Inicio" });
  s.addImage({ path: ICONO, x: 0.7, y: 0.6, w: 0.5, h: 0.5 });
  s.addText("DISEÑO WEB II · UPDS · SEGUNDA PARTE", { x: 0.7, y: 1.25, w: 6, h: 0.35, fontSize: 11, bold: true, color: HEX.accent5, charSpacing: 4, margin: 0, isTextBox: true });
  s.addText("Auditoría WPO y Seguridad OWASP", { x: 0.7, y: 1.7, w: 6.4, h: 1.7, fontFace: "Cambria", fontSize: 42, bold: true, color: "FFFFFF", margin: 0, valign: "top", isTextBox: true });
  s.addText("Taller de Auditoría, Optimización WPO y Seguridad Frontend (OWASP): Café Chiquitano en red 3G", { x: 0.7, y: 3.45, w: 6.2, h: 0.85, fontSize: 16, color: HEX.lt2, margin: 0, isTextBox: true });
  s.addText([
    { text: "Ismael Franco Ruíz", options: { bold: true, breakLine: true } },
    { text: "Lizeth Adela Rodríguez Padilla", options: { bold: true, breakLine: true } },
    { text: "Docente: Ing. Álvaro Moscoso Zeballos", options: { breakLine: true } },
    { text: "Santa Cruz de la Sierra · 24 de noviembre de 2026" },
  ], { x: 0.7, y: 4.75, w: 6, h: 1.4, fontSize: 13, color: "FFFFFF", margin: 0, paraSpaceAfter: 3, isTextBox: true });
  // Captura real de Lighthouse "después" como imagen de portada
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.55, y: 0.85, w: 5.1, h: 5.8, fill: { color: "FFFFFF" }, rectRadius: 0.12, line: { type: "none" }, shadow: { type: "outer", blur: 12, offset: 4, angle: 90, color: "000000", opacity: 0.35 } });
  imagen(s, "lh-despues-carrito.png", 7.7, 1.0, 4.8, 5.5);
  s.addNotes("Presentamos la segunda parte del proyecto Café Chiquitano: la auditoría de rendimiento en red 3G y de seguridad frontend según OWASP. La imagen es el resultado real de Lighthouse después de las optimizaciones.");

  // =========================================================
  // 2. Agenda (tarjetas clicables)
  // =========================================================
  pres.addSection({ title: "Agenda" });
  s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Agenda" });
  s.addText("Agenda", { placeholder: "title" });
  const AGENDA = [
    ["Método 3G", 3, "Cómo medimos"],
    ["Fase 1 · Línea base", 4, "Rendimiento y OWASP"],
    ["Fase 2 · WPO", 6, "Minificar, diferir, comprimir"],
    ["Lo que no funcionó", 8, "CSS en línea descartado"],
    ["Fase 3 · XSS", 9, "Desinfección y ataques"],
    ["Fase 3 · CSP y BD", 11, "Cabeceras, MySQL, SQLi"],
    ["Fase 4 · Antes/después", 13, "Tabla y gráfico"],
    ["ODS y conclusiones", 14, "Aporte y lecciones"],
  ];
  AGENDA.forEach(([t, dest, sub], i) => {
    const x = 0.5 + (i % 4) * 3.1, y = 1.5 + Math.floor(i / 4) * 2.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.85, h: 2.25, fill: { color: C.background2 }, rectRadius: 0.1, line: { type: "none" }, hyperlink: { slide: dest } });
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.25, w: 0.6, h: 0.6, fill: { color: C.accent1 }, line: { type: "none" } });
    s.addText(String(i + 1), { x: x + 0.25, y: y + 0.25, w: 0.6, h: 0.6, fontSize: 18, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText([{ text: t, options: { hyperlink: { slide: dest }, color: C.text1 } }], { x: x + 0.25, y: y + 1.05, w: 2.4, h: 0.6, fontFace: "Cambria", fontSize: 17, bold: true, margin: 0, valign: "top", isTextBox: true });
    s.addText(sub, { x: x + 0.25, y: y + 1.6, w: 2.4, h: 0.4, fontSize: 12, color: C.accent6, margin: 0, isTextBox: true });
  });
  s.addText("Haz clic en una tarjeta para ir a esa sección", { x: 0.5, y: 6.6, w: 12.3, h: 0.3, fontSize: 11, italic: true, color: C.accent1, align: "center", isTextBox: true });

  // =========================================================
  // 3. Método 3G
  // =========================================================
  s = nueva("¿Cómo medimos? Un celular con 3G", "Método");
  cifra(s, 0.5, 1.45, 2.9, 2.0, "300 ms", "RTT", "cada viaje de ida y vuelta");
  cifra(s, 3.6, 1.45, 2.9, 2.0, "700 kbps", "Bajada", "≈ 87 KB por segundo");
  cifra(s, 6.7, 1.45, 2.9, 2.0, "CPU 4×", "Más lenta", "celular de gama media");
  cifra(s, 9.8, 1.45, 3.0, 2.0, "3 × 3", "Corridas", "3 sesiones · mediana de 9", true);
  s.addText(viñetas([
    "Lighthouse 12.8.2 en modo móvil, versión de producción (npm run build + next start)",
    "Páginas auditadas: inicio, menú y carrito",
    "Versión original recuperada de Git (etiqueta antes-auditoria) y servida en paralelo",
    "Corridas intercaladas antes / después, repetidas en 3 sesiones: la CPU del equipo variaba mucho (benchmarkIndex 165–2085)",
  ]), { x: 0.5, y: 3.85, w: 7.6, h: 2.8, fontSize: 15, color: C.text2, valign: "top", paraSpaceAfter: 8, isTextBox: true });
  tarjeta(s, 8.5, 3.85, 4.3, 2.75, "¿Por qué 3G?", "Fuera del centro de las ciudades muchos clientes navegan con poca señal o con pocos megas. Si la tienda funciona bien en 3G, funciona bien para todos.", { oscuro: true });
  s.addNotes("El perfil 3G usa 300 ms de latencia, 700 kbps y CPU cuatro veces más lenta. Seguimos el protocolo de tres corridas con mediana, intercalando antes y después, y lo repetimos en tres sesiones porque la potencia de la CPU del equipo variaba mucho durante el día.");

  // =========================================================
  // 4. Fase 1 – rendimiento
  // =========================================================
  s = nueva("Fase 1 · Línea base de rendimiento", "Fase 1");
  cifra(s, 0.5, 1.45, 2.4, 1.9, seg(INICIAL.inicio.lcp), "LCP del inicio", "bueno ≤ 2,5 s", true);
  cifra(s, 3.05, 1.45, 2.4, 1.9, `${Math.round(INICIAL.inicio.tbt)} ms`, "TBT del inicio", "bueno ≤ 200 ms");
  cifra(s, 0.5, 3.5, 2.4, 1.9, `${Math.round(B_A.porRuta["/"].htmlKB)} KB`, "HTML del inicio", "sin comprimir");
  cifra(s, 3.05, 3.5, 2.4, 1.9, "9", "anchos por imagen", "de 384 a 3840 px");
  s.addText(viñetas([
    `${RETRASO_LCP} del LCP era «retraso de renderizado»: el teléfono estaba ocupado con JavaScript`,
    "Cada tarjeta enviaba el producto completo (con descripción) al botón «Agregar»",
    "La primera foto del menú no tenía prioridad alta",
    "CLS ya excelente (0,000) y fuentes con display: swap",
  ]), { x: 0.5, y: 5.6, w: 5.2, h: 1.3, fontSize: 12.5, color: C.text2, valign: "top", paraSpaceAfter: 3, isTextBox: true });
  imagen(s, "lh-antes-inicio.png", 5.95, 1.4, 6.85, 5.45);
  s.addNotes("La línea base mostró CLS excelente pero un LCP de casi 7 segundos en 3G. Lighthouse indicó que la mayor parte era retraso de renderizado por JavaScript. Encontramos HTML pesado por datos duplicados y nueve anchos por imagen.");

  // =========================================================
  // 5. Fase 1 – seguridad
  // =========================================================
  s = nueva("Fase 1 · Seguridad frente al OWASP Top 10:2025", "Fase 1");
  const filasSeg = [
    ["A05 Injection · XSS", "Sin dangerouslySetInnerHTML; React escapa el texto", "Correcto"],
    ["A05 Injection · XSS almacenado", "Nota del pedido y producto se guardaban con HTML", "Corregido"],
    ["A05 Injection · SQL", "Solo API de Prisma, sin $queryRaw", "Correcto"],
    ["A02 Misconfiguration", "0 cabeceras de seguridad; X-Powered-By visible", "Corregido"],
    ["A03 Supply Chain", "npm audit: 4 vulnerabilidades altas", "Corregido"],
    ["A07 Authentication", "Login admin sin límite de intentos", "Pendiente"],
  ];
  s.addTable([
    [celda("Categoría", ENC), celda("Hallazgo", ENC), celda("Estado", ENC)],
    ...filasSeg.map(([a, b, c]) => [celda(a, { bold: true }), celda(b), celda(c, { bold: true, color: c === "Pendiente" ? HEX.accent1 : c === "Corregido" ? HEX.accent3 : HEX.dk2 })]),
  ], { x: 0.5, y: 1.45, w: 8.4, colW: [2.6, 4.4, 1.4], fontSize: 13, color: HEX.dk2, border: { type: "solid", pt: 0.5, color: HEX.accent2 }, rowH: 0.62, valign: "middle" });
  tarjeta(s, 9.2, 1.45, 3.6, 4.4, "Versión vigente verificada", "OWASP Top 10:2025 (sitio oficial). El XSS (CWE-79) ahora forma parte de A05 Injection, junto con la inyección SQL.\n\nNuevas categorías: A03 Software Supply Chain Failures y A10 Mishandling of Exceptional Conditions.", { oscuro: true });
  s.addNotes("Revisamos el código, las cabeceras con curl y las dependencias con npm audit, y lo comparamos con la edición vigente del OWASP Top 10, la de 2025, que verificamos en el sitio oficial.");

  // =========================================================
  // 6. Fase 2 – minificación y sobrantes
  // =========================================================
  s = nueva("Fase 2 · Minificación y lo que sobraba", "Fase 2");
  imagen(s, "term-04-minificacion.png", 0.5, 1.4, 6.6, 2.2);
  s.addText(viñetas([
    "next build ya minifica JS y CSS (variables de una letra, sin espacios)",
    "Sin dependencias sobrantes: solo next, react, react-dom y @prisma/client",
    "El botón «Agregar» recibe 4 campos en lugar del producto completo",
    "srcset: de 9 a 5 anchos y una sola calidad (60)",
    "Tailwind escaneaba los informes de Lighthouse: +3,8 KB de CSS ajeno, corregido",
  ]), { x: 0.5, y: 3.8, w: 6.6, h: 3.0, fontSize: 14, color: C.text2, valign: "top", paraSpaceAfter: 6, isTextBox: true });
  const filasB = [["/", "Inicio"], ["/menu", "Menú"], ["/admin", "Admin"]].map(([r, n]) => [
    celda(n, { bold: true }), celda(num(B_A.porRuta[r].htmlKB, 1)), celda(num(B_D.porRuta[r].htmlKB, 1), { bold: true, color: HEX.accent3 }), celda(num(B_D.porRuta[r].jsGzipKB, 1)),
  ]);
  s.addText("HTML sin comprimir por página (KB)", { x: 7.5, y: 1.4, w: 5.3, h: 0.4, fontFace: "Cambria", fontSize: 16, bold: true, color: C.text1, margin: 0, isTextBox: true });
  s.addTable([[celda("Página", ENC), celda("Antes", ENC), celda("Después", ENC), celda("JS gzip", ENC)], ...filasB],
    { x: 7.5, y: 1.9, w: 5.3, colW: [1.4, 1.2, 1.3, 1.4], fontSize: 14, color: HEX.dk2, border: { type: "solid", pt: 0.5, color: HEX.accent2 }, rowH: 0.5, align: "center" });
  tarjeta(s, 7.5, 4.25, 5.3, 2.45, "El JS del framework no cambia", `≈ ${Math.round(B_D.porRuta["/"].jsGzipKB)} KB comprimidos por página son React y el router de Next.js. Lo que sí bajó es el HTML que el celular debe analizar.`);
  s.addNotes("La minificación ya la hacía Next.js. Nuestro aporte fue quitar lo que sobraba dentro de cada página: los datos duplicados del producto, los anchos de imagen inútiles y el CSS que Tailwind generaba a partir de los informes.");

  // =========================================================
  // 7. Fase 2 – lazy loading, compresión y caché
  // =========================================================
  s = nueva("Fase 2 · Lazy loading, compresión y caché", "Fase 2");
  tarjeta(s, 0.5, 1.45, 3.95, 3.0, "Imágenes", "Hero y 1.ª foto del menú: eager + fetchPriority=\"high\" (en Next 16 reemplaza a priority).\nEl resto: loading=\"lazy\".");
  tarjeta(s, 4.69, 1.45, 3.95, 3.0, "next/dynamic", "El formulario de producto del admin es un chunk aparte: se descarga solo al pulsar «Nuevo producto» (verificado con Puppeteer).");
  tarjeta(s, 8.88, 1.45, 3.95, 3.0, "Fuentes", "Fraunces y Nunito Sans autoalojadas por next/font, con display: \"swap\": el texto aparece aunque la fuente no haya llegado.");
  s.addTable([
    [celda("Recurso", ENC), celda("Compresión", ENC), celda("Cache-Control", ENC)],
    [celda("HTML (/, /menu)", { bold: true }), celda("gzip"), celda("no-store (datos de MySQL en cada visita)")],
    [celda("/_next/static (JS, CSS, fuentes)", { bold: true }), celda("gzip"), celda("public, max-age=31536000, immutable")],
    [celda("/_next/image (AVIF/WebP)", { bold: true }), celda("formato AVIF"), celda("max-age 1 año; minimumCacheTTL 30 días")],
  ], { x: 0.5, y: 4.7, w: 12.33, colW: [3.6, 2.2, 6.53], fontSize: 13, color: HEX.dk2, border: { type: "solid", pt: 0.5, color: HEX.accent2 }, rowH: 0.45 });
  s.addNotes("La carga diferida se aplica a todo lo que está fuera de pantalla, menos la imagen principal, que se pide con prioridad alta. En el panel admin usamos next/dynamic para el formulario. La compresión gzip y la caché inmutable ya estaban activas; lo verificamos con curl.");

  // =========================================================
  // 8. Experimento descartado
  // =========================================================
  s = nueva("Lo que no funcionó: CSS en línea", "Fase 2");
  cifra(s, 0.5, 1.5, 3.8, 2.4, "84 → 274 KB", "HTML del inicio", "el CSS se duplicaba en el payload RSC", true);
  cifra(s, 4.6, 1.5, 3.8, 2.4, "×2", "TBT en 3G", "de ~360 ms a ~710 ms", true);
  cifra(s, 8.7, 1.5, 4.1, 2.4, "+12 KB", "por las cabeceras", "CSP enviada también en JS e imágenes");
  s.addText(viñetas([
    "Hipótesis: incrustar el CSS evita una petición que bloquea el renderizado. Resultado: peor. Se retiró.",
    "La CSP (~500 bytes) viajaba en cada archivo estático. Ahora solo los documentos la reciben; los estáticos llevan nosniff.",
    "Sin hacer «750» parte del srcset, un celular de 412 px descargaba la foto de 828 px: se restauró.",
  ]), { x: 0.5, y: 4.3, w: 12.3, h: 2.4, fontSize: 16, color: C.text2, valign: "top", paraSpaceAfter: 10, isTextBox: true });
  s.addNotes("Mostramos también lo que salió mal, porque es parte de auditar. El CSS en línea empeoró todo. Además descubrimos que las propias cabeceras de seguridad sumaban 12 KB por página y lo corregimos.");

  // =========================================================
  // 9. Fase 3 – desinfección
  // =========================================================
  s = nueva("Fase 3 · Desinfección en el servidor", "Fase 3");
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.5, y: 1.45, w: 6.4, h: 5.3, fill: { color: "1E1E1E" }, rectRadius: 0.08, line: { type: "none" } });
  s.addText([
    { text: "// lib/validacion.ts", options: { color: "6A9955", breakLine: true } },
    { text: "export function limpiarTexto(valor, multilinea) {", options: { color: "DCDCAA", breakLine: true } },
    { text: "  1. normaliza Unicode (＜ → <)", options: { breakLine: true } },
    { text: "  2. decodifica &lt; &#60; &#x3c;", options: { breakLine: true } },
    { text: "  3. borra <script>…</script>, <iframe>, <svg>…", options: { breakLine: true } },
    { text: "  4. quita toda otra etiqueta (<img onerror>)", options: { breakLine: true } },
    { text: "  5. quita < > ` y javascript:", options: { breakLine: true } },
    { text: "  6. borra caracteres de control e invisibles", options: { breakLine: true } },
    { text: "}", options: { color: "DCDCAA", breakLine: true } },
    { text: " ", options: { breakLine: true } },
    { text: "// se aplica a: cliente, nota,", options: { color: "6A9955", breakLine: true } },
    { text: "// nombre y descripción del producto", options: { color: "6A9955" } },
  ], { x: 0.75, y: 1.65, w: 6.0, h: 4.9, fontFace: "Consolas", fontSize: 14, color: "D4D4D4", valign: "top", margin: 0, isTextBox: true });
  s.addTable([
    [celda("Se envía", ENC), celda("Se guarda", ENC)],
    [celda("<script>alert('XSS')</script>Sin azúcar", { fontFace: "Consolas" }), celda("Sin azúcar", { bold: true })],
    [celda("<img src=x onerror=alert(1)>Ana Rojas", { fontFace: "Consolas" }), celda("Ana Rojas", { bold: true })],
    [celda("&lt;svg onload=alert(1)&gt; leche", { fontFace: "Consolas" }), celda("leche", { bold: true })],
    [celda("María José O'Brien-Suárez", { fontFace: "Consolas" }), celda("igual (texto legítimo)", { bold: true })],
  ], { x: 7.2, y: 1.45, w: 5.6, colW: [3.6, 2.0], fontSize: 12, color: HEX.dk2, border: { type: "solid", pt: 0.5, color: HEX.accent2 }, rowH: 0.6 });
  tarjeta(s, 7.2, 4.65, 5.6, 2.1, "Un error que encontraron las pruebas", "La 1.ª versión borraba el texto que seguía a una etiqueta sin cerrar («leche» se perdía). Seguro, pero perdía datos: se corrigió.", { oscuro: true });
  s.addNotes("La desinfección ocurre en el servidor, así aunque alguien use Postman o curl, en MySQL solo queda texto plano. Las pruebas detectaron un defecto en nuestra primera versión y lo corregimos.");

  // =========================================================
  // 10. Fase 3 – ataques XSS en vivo
  // =========================================================
  s = nueva("Fase 3 · Ataques XSS en la interfaz real", "Fase 3");
  const a1 = imagen(s, "xss-01-pedido-formulario-con-ataque.png", 0.5, 1.45, 5.2, 3.5);
  imagen(s, "xss-04-admin-producto-guardado-limpio.png", 0.5, 5.05, 5.2, 1.75);
  imagen(s, "xss-02-pedido-confirmacion-limpia.png", 5.95, 1.45, 3.4, 5.35);
  cifra(s, 9.6, 1.45, 3.2, 2.5, String(NAV.alertsEjecutados), "alert() ejecutados", "Chrome + Puppeteer detecta cualquier diálogo", true);
  tarjeta(s, 9.6, 4.15, 3.2, 2.65, "Qué probamos", "Formulario de pedido (nombre y nota) y panel admin (nombre y descripción) con <script> e <img onerror>.");
  s.addNotes("Escribimos los ataques en la interfaz real. A la izquierda el formulario con el código malicioso; al centro, la confirmación: dice Gracias Ana y Sin azúcar, por favor. No se ejecutó ningún alert.");

  // =========================================================
  // 11. Fase 3 – CSP y cabeceras
  // =========================================================
  s = nueva("Fase 3 · CSP y cabeceras de seguridad", "Fase 3");
  imagen(s, "csp-06-bloqueo-de-codigo-inyectado.png", 0.5, 1.45, 7.0, 4.4);
  s.addText("Simulamos código ya inyectado: script externo, fetch de cookies, iframe y plugin → los 4 bloqueados", { x: 0.5, y: 5.95, w: 7.0, h: 0.8, fontSize: 13, italic: true, color: C.accent6, margin: 0, isTextBox: true });
  s.addTable([
    [celda("Cabecera", ENC), celda("Para qué", ENC)],
    [celda("Content-Security-Policy", { bold: true }), celda("orígenes permitidos")],
    [celda("X-Content-Type-Options", { bold: true }), celda("nosniff")],
    [celda("Referrer-Policy", { bold: true }), celda("no filtrar rutas")],
    [celda("X-Frame-Options / frame-ancestors", { bold: true }), celda("anti-clickjacking")],
    [celda("Permissions-Policy", { bold: true }), celda("sin cámara ni GPS")],
    [celda("COOP · HSTS", { bold: true }), celda("aislamiento · HTTPS")],
  ], { x: 7.8, y: 1.45, w: 5.0, colW: [2.9, 2.1], fontSize: 12, color: HEX.dk2, border: { type: "solid", pt: 0.5, color: HEX.accent2 }, rowH: 0.46 });
  tarjeta(s, 7.8, 4.85, 5.0, 1.9, "Compromiso elegido", "CSP sin nonce para no perder el pre-renderizado en 3G: requiere 'unsafe-inline' en scripts. React + servidor cubren ese hueco.");
  s.addNotes("La CSP le dice al navegador de dónde puede cargar cosas. Elegimos la variante sin nonce que documenta Next.js porque la otra obliga a renderizar todo en cada visita. Lo decimos con honestidad: eso exige unsafe-inline.");

  // =========================================================
  // 12. Fase 3 – MySQL, SQLi y dependencias
  // =========================================================
  s = nueva("Fase 3 · MySQL limpio, SQL y dependencias", "Fase 3");
  imagen(s, "db-08-phpmyadmin-pedidos-limpios.png", 0.5, 1.45, 7.3, 4.6);
  cifra(s, 8.1, 1.45, 2.25, 1.75, "0", "filas con < >", "en pedidos y productos", true);
  cifra(s, 10.55, 1.45, 2.25, 1.75, "4 → 0", "npm audit", "vulnerabilidades altas");
  s.addTable([
    [celda("Inyección SQL", ENC), celda("Resultado", ENC)],
    [celda("?q=' OR '1'='1", { fontFace: "Consolas" }), celda("0 resultados")],
    [celda("?q='; DROP TABLE…", { fontFace: "Consolas" }), celda("tabla intacta")],
    [celda("/api/productos/1 OR 1=1", { fontFace: "Consolas" }), celda("400")],
    [celda("password=' OR '1'='1", { fontFace: "Consolas" }), celda("401")],
  ], { x: 8.1, y: 3.45, w: 4.7, colW: [2.9, 1.8], fontSize: 11.5, color: HEX.dk2, border: { type: "solid", pt: 0.5, color: HEX.accent2 }, rowH: 0.42 });
  s.addText("Prisma envía los valores como parámetros; overrides en package.json corrigieron effect y deepmerge-ts sin migrar a Prisma 7", { x: 0.5, y: 6.15, w: 12.3, h: 0.6, fontSize: 12.5, italic: true, color: C.accent6, margin: 0, isTextBox: true });
  s.addNotes("En phpMyAdmin se ve que los pedidos de prueba quedaron limpios, y una consulta con REGEXP confirma cero filas con etiquetas. Prisma parametriza todo, así que la inyección SQL no funcionó.");

  // =========================================================
  // 13. Fase 4 – antes / después
  // =========================================================
  pres.addSection({ title: "Fase 4" });
  s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Fase 4" });
  s.addText("Fase 4 · Antes y después (3G, mediana de 9)", { placeholder: "title" });
  s.addText("⌂ Volver a la agenda", { x: 10.3, y: 7.0, w: 2.0, h: 0.3, fontSize: 9, color: C.accent1, underline: true, align: "right", margin: 0, isTextBox: true, hyperlink: { slide: 2 } });
  const P3 = [["inicio", "Inicio"], ["menu", "Menú"], ["carrito", "Carrito"]];
  const filasT = [[celda("Página", ENC), celda("Métrica", ENC), celda("Antes", ENC), celda("Después", ENC), celda("Cambio", ENC)]];
  for (const [k, n] of P3) {
    const a = ANTES[k], d = DESPUES[k];
    const fila = (m, va, vd, cambio, primera) => [celda(primera ? n : "", { bold: true }), celda(m), celda(va), celda(vd, { bold: true }), celda(cambio, { color: cambio.startsWith("−") || cambio.startsWith("+") && m === "Rendimiento" ? HEX.accent3 : HEX.dk2, bold: true })];
    const d2 = (x, y) => { const p = pct(x, y); return (p > 0 ? "+" : p < 0 ? "−" : "±") + Math.abs(p) + " %"; };
    filasT.push(fila("Rendimiento", String(a.rendimiento), String(d.rendimiento), `${d.rendimiento - a.rendimiento >= 0 ? "+" : ""}${d.rendimiento - a.rendimiento} pts`, true));
    filasT.push(fila("LCP", seg(a.lcp), seg(d.lcp), d2(a.lcp, d.lcp)));
    filasT.push(fila("TBT", `${Math.round(a.tbt)} ms`, `${Math.round(d.tbt)} ms`, d2(a.tbt, d.tbt)));
    filasT.push(fila("Peso · Pet.", `${Math.round(a.pesoKB)} KB · ${a.peticiones}`, `${Math.round(d.pesoKB)} KB · ${d.peticiones}`, d2(a.pesoKB, d.pesoKB)));
  }
  s.addTable(filasT, { x: 0.5, y: 1.35, w: 6.6, colW: [1.0, 1.35, 1.45, 1.55, 1.25], fontSize: 11, color: HEX.dk2, border: { type: "solid", pt: 0.5, color: HEX.accent2 }, rowH: 0.36 });
  s.addChart(pres.charts.BAR, [
    { name: "Antes", labels: P3.map((p) => p[1]), values: P3.map(([k]) => Math.round(ANTES[k].tbt)) },
    { name: "Después", labels: P3.map((p) => p[1]), values: P3.map(([k]) => Math.round(DESPUES[k].tbt)) },
  ], {
    x: 7.4, y: 1.35, w: 5.4, h: 3.35, barDir: "col", barGrouping: "clustered",
    chartColors: [HEX.accent4, HEX.accent1], showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 11, dataLabelColor: HEX.dk2, dataLabelFontFace: "+mn-lt",
    showTitle: true, title: "TBT en 3G (ms) · menos es mejor", titleFontSize: 14, titleColor: HEX.dk1, titleFontFace: "+mj-lt",
    showLegend: true, legendPos: "b", legendFontSize: 11, legendFontFace: "+mn-lt",
    catAxisLabelColor: HEX.dk2, valAxisLabelColor: HEX.accent4, catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", catAxisLabelFontSize: 12, valAxisLabelFontSize: 10,
    valGridLine: { color: "EFE0CC", size: 0.5 }, catGridLine: { style: "none" },
  });
  tarjeta(s, 7.4, 4.9, 5.4, 1.9, "Lectura honesta", `Seguro: peso −${-pct(ANTES.menu.pesoKB, DESPUES.menu.pesoKB)} % en el menú y fotos −${-pct(imgKB("antes"), imgKB("despues"))} %. Tendencia: el TBT bajó en la mediana, pero solo en ${SES_TBT.inicio}/${N_SES} sesiones en inicio y menú (ruido de CPU). El carrito sube 4 KB por las cabeceras.`, { oscuro: true });
  s.addNotes("Esta es la tabla antes y después: mediana de nueve corridas en tres sesiones. Lo seguro es lo que no depende de la CPU: el peso del inicio y del menú bajó y las fotos pesan 22 % menos. El TBT bajó en la mediana, pero no en todas las sesiones, así que lo presentamos como tendencia. El carrito pesa 4 KB más por las cabeceras de seguridad. El LCP simulado en 3G supera los 2,5 segundos porque lo domina el JavaScript del framework; con la red 3G aplicada de verdad en Chrome el LCP del menú fue de unos 2,5 segundos.");

  // =========================================================
  // 14. ODS
  // =========================================================
  pres.addSection({ title: "Cierre" });
  s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Cierre" });
  s.addText("ODS vinculados y ejes transversales", { placeholder: "title" });
  s.addText("⌂ Volver a la agenda", { x: 10.3, y: 7.0, w: 2.0, h: 0.3, fontSize: 9, color: C.accent1, underline: true, align: "right", margin: 0, isTextBox: true, hyperlink: { slide: 2 } });
  const ODS = [
    ["4", "C5192D", "Educación de calidad", "Auditoría documentada con scripts reproducibles, incluidos los errores, para que otros aprendan."],
    ["8", "A21942", "Trabajo decente y crecimiento", "Una pyme que vende en línea de forma segura protege a sus clientes y su reputación."],
    ["9", "FD6925", "Industria e innovación", "Buenas prácticas de la industria (Core Web Vitals, OWASP 2025, CSP) en una pyme local."],
    ["10", "DD1367", "Reducción de desigualdades", "Optimizar para 3G ayuda a quien tiene mala señal o compra datos por megas."],
  ];
  ODS.forEach(([n, col, t, d], i) => {
    const x = 0.5 + (i % 2) * 6.25, y = 1.45 + Math.floor(i / 2) * 2.15;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 6.0, h: 1.9, fill: { color: C.background2 }, rectRadius: 0.1, line: { type: "none" } });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.25, y: y + 0.3, w: 1.2, h: 1.3, fill: { color: col }, rectRadius: 0.08, line: { type: "none" } });
    s.addText([{ text: "ODS", options: { fontSize: 11, bold: true, breakLine: true } }, { text: n, options: { fontSize: 30, bold: true } }], { x: x + 0.25, y: y + 0.3, w: 1.2, h: 1.3, color: "FFFFFF", align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(t, { x: x + 1.7, y: y + 0.28, w: 4.1, h: 0.45, fontFace: "Cambria", fontSize: 17, bold: true, color: C.text1, margin: 0, isTextBox: true });
    s.addText(d, { x: x + 1.7, y: y + 0.78, w: 4.1, h: 0.95, fontSize: 13, color: C.text2, margin: 0, valign: "top", isTextBox: true });
  });
  s.addText([
    { text: "Ejes transversales  ", options: { bold: true, color: C.accent1 } },
    { text: "Tecnologías emergentes e IA · Emprendedurismo e innovación · Investigación en el aula · Responsabilidad social y ética (auditoría defensiva, solo en localhost)" },
  ], { x: 0.5, y: 5.85, w: 12.3, h: 0.8, fontSize: 13, color: C.text2, margin: 0, isTextBox: true });
  s.addNotes("Relacionamos el trabajo con los ODS 4, 8, 9 y 10. El 10 es el más directo: una tienda rápida en 3G es más accesible para quien tiene mala conexión.");

  // =========================================================
  // 15. Conclusiones
  // =========================================================
  s = pres.addSlide({ masterName: "Oscuro", sectionTitle: "Cierre" });
  s.addImage({ path: ICONO, x: 0.7, y: 0.6, w: 0.5, h: 0.5 });
  s.addText("Conclusiones", { x: 0.7, y: 1.2, w: 8, h: 0.9, fontFace: "Cambria", fontSize: 38, bold: true, color: "FFFFFF", margin: 0, isTextBox: true });
  const CONC = [
    ["Medir antes de creer", "La ganancia vino de quitar datos del HTML, no de la minificación; y el CSS en línea empeoró todo."],
    ["Menos peso, más rápido", `Menú ${Math.round(ANTES.menu.pesoKB)} → ${Math.round(DESPUES.menu.pesoKB)} KB; TBT mediano ${Math.round((ANTES.inicio.tbt + ANTES.menu.tbt + ANTES.carrito.tbt) / 3)} → ${Math.round((DESPUES.inicio.tbt + DESPUES.menu.tbt + DESPUES.carrito.tbt) / 3)} ms (tendencia, con ruido de CPU).`],
    ["XSS bloqueado en 3 capas", "React escapa, el servidor limpia, la CSP bloquea. 0 alert() ejecutados."],
    ["Pendientes", "LCP en 3G > 2,5 s, límite de intentos de login y HTTPS al publicar."],
  ];
  CONC.forEach(([t, d], i) => {
    const y = 2.35 + i * 1.12;
    s.addShape(pres.shapes.OVAL, { x: 0.7, y, w: 0.62, h: 0.62, fill: { color: C.accent1 }, line: { type: "none" } });
    s.addText(String(i + 1), { x: 0.7, y, w: 0.62, h: 0.62, fontSize: 18, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText([{ text: t, options: { bold: true, fontSize: 17, color: "FFFFFF", breakLine: true } }, { text: d, options: { fontSize: 13.5, color: HEX.accent2 } }], { x: 1.55, y: y - 0.08, w: 6.6, h: 0.95, margin: 0, valign: "top", isTextBox: true });
  });
  // Tarjeta blanca ajustada al tamaño real de la captura (phpMyAdmin: productos limpios)
  {
    const cap = "db-09-phpmyadmin-productos-limpios.png";
    const { w: iw, h: ih } = tamPng(path.join(CAP, cap));
    const esc = Math.min(4.6 / iw, 4.6 / ih), ww = iw * esc, hh = ih * esc;
    const x0 = 8.4 + (4.6 - ww) / 2, y0 = 1.5 + (4.6 - hh) / 2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x0 - 0.15, y: y0 - 0.15, w: ww + 0.3, h: hh + 0.3, fill: { color: "FFFFFF" }, rectRadius: 0.08, line: { type: "none" } });
    s.addImage({ path: path.join(CAP, cap), x: x0, y: y0, w: ww, h: hh });
    s.addText("MySQL: productos de prueba guardados sin etiquetas", { x: 8.25, y: y0 + hh + 0.25, w: 4.9, h: 0.35, fontSize: 11, italic: true, color: HEX.accent2, align: "center", margin: 0, isTextBox: true });
  }
  s.addText("Gracias · ¿Preguntas?", { x: 0.7, y: 6.75, w: 6, h: 0.45, fontFace: "Cambria", fontSize: 18, italic: true, color: HEX.accent5, margin: 0, isTextBox: true });
  s.addNotes("Cerramos con cuatro ideas: medir antes de creer, la mejora en interactividad, el XSS bloqueado en tres capas y lo que queda pendiente. Gracias.");

  await pres.writeFile({ fileName: SALIDA });
  if (process.env.APPLY_THEME) {
    const { applyTheme } = require(process.env.APPLY_THEME);
    await applyTheme(SALIDA, THEME);
  }
  console.log("✓", SALIDA);
})();
