// =============================================================
// Presentación del Proyecto Final (PowerPoint) con pptxgenjs.
// Uso: NODE_PATH=<node_modules con pptxgenjs> node generar-presentacion.js
// Mismo estilo que las presentaciones anteriores (café / crema / terracota,
// títulos Cambria, agenda con tarjetas clicables), estructura IMRyD, datos
// reales de informe-final/resultados, URL pública y código QR.
// =============================================================
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const FIN = path.join(__dirname, "..");
const RES = path.join(FIN, "resultados");
const CAP = path.join(FIN, "capturas");
const DIA = path.join(FIN, "diagramas");
const REC = path.join(FIN, "recursos");
const leer = (p) => JSON.parse(fs.readFileSync(path.join(RES, p), "utf8"));
const PRUEBAS = leer("prueba-funcional-nube.json");
const STD = leer("lighthouse/nube-estandar/resumen.json");
const G3 = leer("lighthouse/nube-3g/resumen.json");
const URL = "https://mercado-justo-cruceno.vercel.app";
const SALIDA = path.join(FIN, "Presentacion_Mercado_Justo_Crucenio.pptx");
const PAGS = [["inicio", "Inicio"], ["catalogo", "Catálogo"], ["emprendedor", "Emprendedor"], ["registro", "Registro"]];

const HEX = {
  dk1: "2B1A12", dk2: "3D2618", lt2: "F7EFE3", accent1: "B9471C", accent2: "E3CBAB",
  accent3: "2F6B3A", accent4: "B98E70", accent5: "E07A45", accent6: "6F4630",
};
const num = (x, d = 2) => x.toFixed(d).replace(".", ",");
const seg = (ms) => num(ms / 1000) + " s";
function tamPng(archivo) {
  const b = fs.readFileSync(archivo);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function imagen(slide, ruta, x, y, w, h, extra = {}) {
  const { w: iw, h: ih } = tamPng(ruta);
  const e = Math.min(w / iw, h / ih);
  const ww = iw * e, hh = ih * e;
  slide.addImage({ path: ruta, x: x + (w - ww) / 2, y: y + (h - hh) / 2, w: ww, h: hh, ...extra });
}

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_WIDE";
  pres.title = "Mercado Justo Cruceño – Proyecto Socioformativo Integrador";
  pres.author = "Ismael Franco Ruíz; Lizeth Adela Rodríguez Padilla";
  pres.subject = "Diseño Web II – UPDS";
  pres.theme = { headFontFace: "Cambria", bodyFontFace: "Calibri" };
  const ICONO = path.join(REC, "icono-tienda.png");
  const QR = path.join(REC, "qr-url.png");
  // pptxgenjs modifica el objeto de sombra al usarlo (lo pasa a EMU): se crea uno nuevo en cada uso
  const sombra = () => ({ type: "outer", blur: 10, offset: 3, angle: 90, color: "000000", opacity: 0.25 });

  pres.defineSlideMaster({
    title: "Contenido",
    background: { color: "FFFFFF" },
    objects: [
      { image: { path: ICONO, x: 0.5, y: 0.42, w: 0.62, h: 0.62 } },
      { text: { text: "Mercado Justo Cruceño · Proyecto Socioformativo Integrador · Diseño Web II · UPDS", options: { x: 0.5, y: 7.0, w: 8, h: 0.3, fontSize: 9, color: HEX.accent1, margin: 0 } } },
      { placeholder: { options: { name: "title", type: "title", x: 1.35, y: 0.38, w: 11.4, h: 0.72, fontSize: 30, bold: true, color: HEX.dk1, fontFace: "Cambria", valign: "middle", margin: 0 }, text: "" } },
    ],
    slideNumber: { x: 12.4, y: 7.0, w: 0.5, h: 0.3, fontSize: 9, color: HEX.accent4, align: "right" },
  });
  pres.defineSlideMaster({ title: "Oscuro", background: { color: HEX.dk1 }, objects: [] });

  const secciones = {};
  function nueva(titulo, seccion) {
    if (!secciones[seccion]) { pres.addSection({ title: seccion }); secciones[seccion] = true; }
    const s = pres.addSlide({ masterName: "Contenido", sectionTitle: seccion });
    s.addText(titulo, { placeholder: "title" });
    s.addText("⌂ Volver a la agenda", { x: 10.3, y: 7.0, w: 2.0, h: 0.3, fontSize: 9, color: HEX.accent1, underline: true, align: "right", margin: 0, isTextBox: true, hyperlink: { slide: 2 } });
    return s;
  }
  function cifra(s, x, y, w, h, valor, etiqueta, detalle, oscuro = false) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: oscuro ? HEX.dk2 : HEX.lt2 }, rectRadius: 0.1, line: { type: "none" } });
    s.addText(valor, { x, y: y + 0.1, w, h: h * 0.48, fontFace: "Cambria", fontSize: 32, bold: true, color: oscuro ? HEX.accent5 : HEX.accent1, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText([
      { text: etiqueta, options: { bold: true, fontSize: 12.5, color: oscuro ? "FFFFFF" : HEX.dk1, breakLine: true } },
      { text: detalle, options: { fontSize: 10, color: oscuro ? HEX.accent2 : HEX.accent6 } },
    ], { x: x + 0.12, y: y + h * 0.55, w: w - 0.24, h: h * 0.42, align: "center", valign: "top", margin: 0, isTextBox: true });
  }
  function tarjeta(s, x, y, w, h, titulo, cuerpo, o = {}) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: o.oscuro ? HEX.dk2 : o.color ?? HEX.lt2 }, rectRadius: 0.1, line: { type: "none" } });
    s.addText(titulo, { x: x + 0.22, y: y + 0.15, w: w - 0.44, h: 0.45, fontFace: "Cambria", fontSize: o.tamTitulo ?? 17, bold: true, color: o.oscuro ? "FFFFFF" : HEX.dk1, margin: 0, isTextBox: true });
    s.addText(cuerpo, { x: x + 0.22, y: y + 0.65, w: w - 0.44, h: h - 0.78, fontSize: o.tam ?? 13, color: o.oscuro ? HEX.accent2 : HEX.dk2, valign: "top", margin: 0, paraSpaceAfter: 5, isTextBox: true });
  }
  const viñetas = (items) => items.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < items.length - 1 } }));
  const ENC = { bold: true, color: "FFFFFF", fill: { color: HEX.dk2 } };
  const c = (t, o = {}) => ({ text: String(t), options: o });
  function captura(s, archivo, x, y, w, h) {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.05, y: y - 0.05, w: w + 0.1, h: h + 0.1, fill: { color: "FFFFFF" }, rectRadius: 0.05, line: { color: HEX.accent2, width: 1 }, shadow: sombra() });
    imagen(s, path.join(CAP, archivo), x, y, w, h);
  }

  // 1. Portada ------------------------------------------------
  pres.addSection({ title: "Inicio" });
  let s = pres.addSlide({ masterName: "Oscuro", sectionTitle: "Inicio" });
  s.addImage({ path: ICONO, x: 0.7, y: 0.55, w: 0.7, h: 0.7 });
  s.addText("PROYECTO SOCIOFORMATIVO INTEGRADOR · DISEÑO WEB II · UPDS", { x: 0.7, y: 1.45, w: 7, h: 0.35, fontSize: 11, bold: true, color: HEX.accent5, charSpacing: 3, margin: 0, isTextBox: true });
  s.addText("Mercado Justo Cruceño", { x: 0.7, y: 1.85, w: 6.6, h: 1.0, fontFace: "Cambria", fontSize: 44, bold: true, color: "FFFFFF", margin: 0, isTextBox: true });
  s.addText("Plataforma Web Dinámica de Comercio Justo para la Inclusión Digital de Microempresarios Periurbanos en Santa Cruz", { x: 0.7, y: 2.9, w: 6.4, h: 1.1, fontSize: 17, color: HEX.lt2, margin: 0, isTextBox: true });
  s.addText([
    { text: "Ismael Franco Ruíz", options: { bold: true, breakLine: true } },
    { text: "Lizeth Adela Rodríguez Padilla", options: { bold: true, breakLine: true } },
    { text: "Docente: Ing. Álvaro Moscoso Zeballos", options: { breakLine: true } },
    { text: "Santa Cruz de la Sierra · 26 de noviembre de 2026" },
  ], { x: 0.7, y: 4.4, w: 6, h: 1.4, fontSize: 13, color: "FFFFFF", margin: 0, paraSpaceAfter: 3, isTextBox: true });
  s.addText([{ text: URL.replace("https://", ""), options: { hyperlink: { url: URL }, color: HEX.accent5 } }], { x: 0.7, y: 6.15, w: 6.5, h: 0.4, fontSize: 15, bold: true, margin: 0, isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.45, y: 0.8, w: 5.35, h: 5.9, fill: { color: "FFFFFF" }, rectRadius: 0.12, line: { type: "none" }, shadow: sombra() });
  imagen(s, path.join(CAP, "24-movil-inicio.png"), 7.6, 0.95, 2.6, 5.6);
  imagen(s, QR, 10.35, 2.2, 2.3, 2.3, { hyperlink: { url: URL } });
  s.addText("Escanea y pruébala", { x: 10.2, y: 4.55, w: 2.6, h: 0.4, fontSize: 13, bold: true, color: HEX.dk1, align: "center", isTextBox: true });
  s.addNotes("Presentamos Mercado Justo Cruceño, nuestro proyecto socioformativo: una plataforma de comercio justo para microemprendedores de los barrios periurbanos de Santa Cruz. Está publicada en internet; pueden escanear el QR y usarla durante la presentación.");

  // 2. Agenda -------------------------------------------------
  pres.addSection({ title: "Agenda" });
  s = pres.addSlide({ masterName: "Contenido", sectionTitle: "Agenda" });
  s.addText("Agenda", { placeholder: "title" });
  const AGENDA = [
    ["Introducción", 3, "Problema y pregunta"], ["Objetivos", 5, "General y específicos"],
    ["Métodos", 6, "Etapas, requisitos, diseño"], ["Despliegue", 10, "TiDB + Vercel + GitHub"],
    ["Resultados", 11, "Funciones y capturas"], ["Seguridad y rendimiento", 14, "Pruebas y Lighthouse"],
    ["Discusión", 16, "Impacto, ODS, límites"], ["Conclusiones y demo", 17, "Cierre y QR"],
  ];
  AGENDA.forEach(([t, dest, sub], i) => {
    const x = 0.5 + (i % 4) * 3.1, y = 1.5 + Math.floor(i / 4) * 2.55;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.85, h: 2.25, fill: { color: HEX.lt2 }, rectRadius: 0.1, line: { type: "none" }, hyperlink: { slide: dest } });
    s.addShape(pres.shapes.OVAL, { x: x + 0.25, y: y + 0.25, w: 0.6, h: 0.6, fill: { color: HEX.accent1 }, line: { type: "none" } });
    s.addText(String(i + 1), { x: x + 0.25, y: y + 0.25, w: 0.6, h: 0.6, fontSize: 18, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText([{ text: t, options: { hyperlink: { slide: dest }, color: HEX.dk1 } }], { x: x + 0.25, y: y + 1.05, w: 2.4, h: 0.6, fontFace: "Cambria", fontSize: 17, bold: true, margin: 0, valign: "top", isTextBox: true });
    s.addText(sub, { x: x + 0.25, y: y + 1.6, w: 2.4, h: 0.4, fontSize: 12, color: HEX.accent6, margin: 0, isTextBox: true });
  });
  s.addText("Haz clic en una tarjeta para ir a esa sección", { x: 0.5, y: 6.6, w: 12.3, h: 0.3, fontSize: 11, italic: true, color: HEX.accent1, align: "center", isTextBox: true });

  // 3. Problema en cifras --------------------------------------
  s = nueva("Introducción · El problema en cifras", "Introducción");
  cifra(s, 0.5, 1.4, 3.0, 2.2, "82,3 %", "Empleo informal en Bolivia", "1.er semestre 2025 · OIT (2025)", true);
  cifra(s, 3.65, 1.4, 3.0, 2.2, "46,7 %", "Promedio de la región", "América Latina y el Caribe · OIT (2025)");
  cifra(s, 6.8, 1.4, 3.0, 2.2, "82,8 %", "Cruceños en área urbana", "Censo 2024 · INE (2025)");
  cifra(s, 9.95, 1.4, 2.85, 2.2, "99 %", "Empresas que son mipymes", "América Latina · CEPAL (s.f.)");
  cifra(s, 0.5, 3.8, 3.0, 2.2, "79,7 %", "Bolivianos que usan internet", "2024 · Banco Mundial / UIT");
  cifra(s, 3.65, 3.8, 3.0, 2.2, "11,25 M", "Líneas móviles con internet", "dic. 2024 · ATT (2025)");
  cifra(s, 6.8, 3.8, 3.0, 2.2, "+131 %", "Pagos por QR", "2025 vs 2024 · BCB (2026)", true);
  tarjeta(s, 9.95, 3.8, 2.85, 2.2, "Sin dato oficial", "Margen de los intermediarios en Santa Cruz: no encontramos fuente, así que no lo cuantificamos.", { tam: 11.5, tamTitulo: 15 });
  s.addText("Mucha informalidad, pero celular, internet y pago por QR ya están en manos de compradores y productores.", { x: 0.5, y: 6.25, w: 12.3, h: 0.5, fontSize: 15, italic: true, color: HEX.accent1, isTextBox: true });
  s.addNotes("Bolivia tiene la informalidad laboral más alta de la región, 82,3 % según la OIT frente a 46,7 % regional. Santa Cruz es el departamento más poblado y mayoritariamente urbano. A la vez, casi 80 % usa internet y los pagos QR crecieron 131 %. No encontramos una fuente para el margen de los intermediarios, por eso no damos un número.");

  // 4. Problema y pregunta -------------------------------------
  s = nueva("Introducción · Problema contextual y pregunta", "Introducción");
  tarjeta(s, 0.5, 1.4, 4.0, 2.6, "1. Sin canal digital", "Venden en la puerta, por estados de WhatsApp o en ferias de fin de semana.");
  tarjeta(s, 4.65, 1.4, 4.0, 2.6, "2. Intermediarios", "Rescatistas, revendedores y distribuidoras fijan el precio y a veces pagan a 30 días.");
  tarjeta(s, 8.8, 1.4, 4.0, 2.6, "3. Informalidad y desconfianza", "El comprador no sabe quién produce ni cuánto recibe; el productor no tiene registro de pedidos.");
  tarjeta(s, 0.5, 4.25, 12.3, 2.35, "Pregunta de investigación", "¿Es posible, con tecnologías web modernas y servicios en la nube gratuitos, construir y desplegar una plataforma de comercio justo segura y rápida en redes móviles que permita a microempresarios periurbanos de Santa Cruz vender directamente a clientes de toda la ciudad, sin intermediarios y con transparencia sobre lo que recibe el productor?", { oscuro: true, tam: 16, tamTitulo: 19 });
  s.addNotes("El problema tiene tres partes: no tienen canal digital propio, dependen de intermediarios y hay informalidad y desconfianza. De ahí nuestra pregunta de investigación.");

  // 5. Objetivos ----------------------------------------------
  s = nueva("Objetivos", "Objetivos");
  tarjeta(s, 0.5, 1.4, 4.4, 5.2, "Objetivo general", "Desarrollar y desplegar en internet una plataforma web dinámica de comercio justo, multivendedor, segura y optimizada para móviles, que facilite la inclusión digital de microempresarios de los barrios periurbanos de Santa Cruz de la Sierra.", { oscuro: true, tam: 16 });
  s.addText(viñetas([
    "Analizar el problema con datos oficiales (OIT, INE, CEPAL, Banco Mundial, ATT, BCB).",
    "Diseñar un modelo relacional en 3FN y una arquitectura con roles ADMIN y EMPRENDEDOR.",
    "Implementar registro, páginas de emprendedores, catálogo filtrable y compra multivendedor con comercio justo visible.",
    "Conservar y ampliar las optimizaciones WPO y los controles OWASP de la versión auditada.",
    "Desplegar en Vercel con MySQL en la nube y verificar funcionamiento, seguridad y rendimiento sobre la URL pública.",
  ]), { x: 5.2, y: 1.4, w: 7.6, h: 5.2, fontSize: 16, color: HEX.dk2, valign: "top", paraSpaceAfter: 12, isTextBox: true });

  // 6. Métodos: etapas -----------------------------------------
  s = nueva("Métodos · Metodología ágil por etapas", "Métodos");
  const ETAPAS = [
    ["18/11", "Café Chiquitano", "Tienda base Next.js + MySQL"],
    ["22–24/11", "Auditoría WPO/OWASP", "Rendimiento 3G y seguridad"],
    ["25/11", "Análisis y diseño", "Requisitos, casos de uso, ER"],
    ["25/11", "Plataforma multivendedor", `Roles, catálogo, comercio justo`],
    ["26/11", "Despliegue", "TiDB Cloud + GitHub + Vercel"],
    ["26/11", "Verificación", "Pruebas, Lighthouse, informe"],
  ];
  ETAPAS.forEach(([f, t, d], i) => {
    const x = 0.5 + i * 2.07;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.5, w: 1.92, h: 2.4, fill: { color: i >= 2 ? HEX.dk2 : HEX.lt2 }, rectRadius: 0.1, line: { type: "none" } });
    s.addText(f, { x, y: 1.62, w: 1.92, h: 0.35, fontSize: 12, bold: true, color: i >= 2 ? HEX.accent5 : HEX.accent1, align: "center", margin: 0, isTextBox: true });
    s.addText(t, { x: x + 0.1, y: 2.0, w: 1.72, h: 0.85, fontFace: "Cambria", fontSize: 15, bold: true, color: i >= 2 ? "FFFFFF" : HEX.dk1, align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(d, { x: x + 0.1, y: 2.9, w: 1.72, h: 0.9, fontSize: 11.5, color: i >= 2 ? HEX.accent2 : HEX.dk2, align: "center", valign: "top", margin: 0, isTextBox: true });
  });
  s.addTable([
    [c("Capa", ENC), c("Tecnología", ENC)],
    [c("Interfaz"), c("React 19 · Next.js 16 (App Router, Cache Components) · Tailwind CSS 4")],
    [c("Datos"), c("Prisma 6 · MySQL (XAMPP local) · TiDB Cloud Starter (nube)")],
    [c("Seguridad"), c("bcrypt · sesión HMAC-SHA256 · CSP y cabeceras · anti-CSRF · anti-IDOR")],
    [c("Despliegue y pruebas"), c("GitHub · Vercel · Lighthouse · Playwright · 36 pruebas HTTP")],
  ], { x: 0.5, y: 4.2, w: 12.3, colW: [2.6, 9.7], fontSize: 13, color: HEX.dk1, border: { type: "solid", color: HEX.accent2, pt: 0.75 }, fill: { color: "FFFFFF" }, rowH: 0.42 });
  s.addNotes("Trabajamos por etapas cortas al estilo Scrum, cada una con un entregable probado. Las fechas salen del historial de Git. Las primeras dos etapas son las entregas anteriores, que reutilizamos.");

  // 7. Requisitos y casos de uso -------------------------------
  s = nueva("Métodos · Requisitos y casos de uso", "Métodos");
  s.addText(viñetas([
    "12 requisitos funcionales: registro, aprobación, roles, CRUD propio, página del emprendedor, catálogo filtrable, comercio justo visible, WhatsApp, compra multivendedor, QR, pedidos por emprendedor y seed.",
    "6 no funcionales: Lighthouse móvil ≥ 90, seguridad OWASP, HTTPS, accesibilidad, integridad (3FN, transacciones) y secretos fuera de GitHub.",
    "3 actores: cliente sin cuenta, emprendedor y administrador.",
  ]), { x: 0.5, y: 1.4, w: 4.3, h: 5.3, fontSize: 14, color: HEX.dk2, valign: "top", paraSpaceAfter: 10, isTextBox: true });
  imagen(s, path.join(DIA, "casos-de-uso.png"), 5.0, 1.3, 7.8, 5.6);

  // 8. Arquitectura --------------------------------------------
  s = nueva("Métodos · Arquitectura", "Métodos");
  imagen(s, path.join(DIA, "arquitectura.png"), 0.5, 1.25, 12.3, 5.65);
  s.addNotes("Todo vive en un proyecto Next.js. En el borde, proxy.ts controla el acceso por rol y el origen de las peticiones; las páginas son componentes de servidor; la capa lib/ valida y desinfecta y es la única que habla con la base mediante Prisma.");

  // 9. Modelo ER -----------------------------------------------
  s = nueva("Métodos · Modelo entidad-relación (3FN)", "Métodos");
  imagen(s, path.join(DIA, "modelo-er.png"), 0.4, 1.2, 8.2, 5.75);
  tarjeta(s, 8.8, 1.4, 4.0, 5.2, "Decisiones clave", "• Rubros y barrios en tablas propias para filtrar.\n• Un usuario ↔ como máximo un emprendedor.\n• La compra guarda al cliente una sola vez y se reparte en un pedido por emprendedor.\n• Cada pedido guarda subtotal, comisión y monto del productor.\n• El detalle copia nombre y precio al comprar.", { tam: 13.5 });

  // 10. Despliegue ---------------------------------------------
  s = nueva("Métodos · Despliegue en la nube", "Despliegue");
  imagen(s, path.join(DIA, "despliegue.png"), 0.5, 1.2, 12.3, 3.3);
  tarjeta(s, 0.5, 4.7, 4.0, 2.0, "¿Por qué TiDB Cloud?", "Compatible con MySQL y Prisma, gratis y sin tarjeta. Aiven dejó de ofrecer MySQL gratis (retiro 21/12/2026).", { tam: 12.5 });
  tarjeta(s, 4.65, 4.7, 4.0, 2.0, "Secretos protegidos", "Historial revisado antes del push; DATABASE_URL y AUTH_SECRET solo como variables secretas en Vercel.", { tam: 12.5 });
  tarjeta(s, 8.8, 4.7, 4.0, 2.0, "Publicada", URL.replace("https://", "") + "\nHTTPS + HSTS · región us-east-1 junto a la base", { oscuro: true, tam: 13 });

  // 11. Resultados: catálogo ------------------------------------
  s = nueva("Resultados · Catálogo y comercio justo visible", "Resultados");
  captura(s, "04-catalogo.png", 0.5, 1.35, 7.4, 4.66);
  captura(s, "26-movil-emprendedor.png", 8.3, 1.35, 2.3, 4.97);
  s.addText(viñetas([
    "Filtros por rubro, barrio y emprendedor + buscador",
    "Cada producto: quién, dónde y «el productor recibe 100 %»",
    "Botón de WhatsApp directo",
    "Página propia con la historia",
  ]), { x: 10.75, y: 1.35, w: 2.1, h: 5.0, fontSize: 12, color: HEX.dk2, valign: "top", paraSpaceAfter: 8, isTextBox: true });
  s.addText("Capturas reales de la URL pública", { x: 0.5, y: 6.45, w: 7, h: 0.3, fontSize: 11, italic: true, color: HEX.accent6, isTextBox: true });

  // 12. Resultados: compra multivendedor -----------------------
  s = nueva("Resultados · Compra multivendedor", "Resultados");
  captura(s, "10-carrito.png", 0.5, 1.35, 6.0, 3.78);
  captura(s, "11-confirmacion.png", 6.8, 1.35, 6.0, 3.78);
  tarjeta(s, 0.5, 5.35, 12.3, 1.4, "Una compra, un pedido por emprendedor", "El servidor recalcula los precios en una transacción, reparte la compra y muestra a cada productor con su desglose (comisión Bs 0,00), su QR de pago referencial y su WhatsApp para coordinar la entrega.", { tam: 13 });

  // 13. Resultados: paneles -------------------------------------
  s = nueva("Resultados · Paneles del emprendedor y del administrador", "Resultados");
  captura(s, "18-panel-pedido-preparando.png", 0.5, 1.35, 6.0, 3.78);
  captura(s, "20-admin-emprendedores.png", 6.8, 1.35, 6.0, 3.78);
  s.addText("Emprendedor: solo SUS productos y pedidos, con WhatsApp al cliente y cambio de estado.", { x: 0.5, y: 5.3, w: 6.0, h: 0.9, fontSize: 13, color: HEX.dk2, isTextBox: true });
  s.addText("Administrador: aprueba o suspende emprendedores, supervisa pedidos y modera productos.", { x: 6.8, y: 5.3, w: 6.0, h: 0.9, fontSize: 13, color: HEX.dk2, isTextBox: true });

  // 14. Seguridad ----------------------------------------------
  s = nueva("Resultados · Pruebas de seguridad sobre la URL pública", "Seguridad y rendimiento");
  cifra(s, 0.5, 1.4, 2.8, 2.0, `${PRUEBAS.pasan}/${PRUEBAS.total}`, "Pruebas superadas", "funcionales y de seguridad", true);
  const clave = ["S01", "S03", "S05", "S08", "S10", "S13", "S14", "S16", "S17"];
  s.addTable([
    [c("ID", ENC), c("Ataque o control", ENC), c("Resultado", ENC)],
    ...PRUEBAS.resultados.filter((r) => clave.includes(r.id)).map((r) => [c(r.id), c(r.descripcion), c(r.resultado, { bold: true, color: r.resultado === "PASA" ? HEX.accent3 : HEX.accent1 })]),
  ], { x: 3.55, y: 1.4, w: 9.25, colW: [0.7, 7.25, 1.3], fontSize: 12, color: HEX.dk1, border: { type: "solid", color: HEX.accent2, pt: 0.75 }, rowH: 0.48 });
  tarjeta(s, 0.5, 3.6, 2.8, 3.0, "OWASP Top 10:2025", "A01 acceso · A02 configuración · A04 criptografía · A05 inyección (XSS, SQL) · A07 autenticación", { tam: 12 });
  s.addNotes("Ejecutamos 36 pruebas automatizadas contra la URL pública y todas pasaron. Por ejemplo, una cookie con el rol cambiado a ADMIN se rechaza por la firma, un emprendedor no puede tocar productos ajenos y al quinto intento fallido la cuenta se bloquea.");

  // 15. Rendimiento ---------------------------------------------
  s = nueva("Resultados · Rendimiento móvil (Lighthouse, URL pública)", "Seguridad y rendimiento");
  s.addTable([
    [c("Página", ENC), c("Estándar: rendimiento", ENC), c("LCP", ENC), c("TBT", ENC), c("CLS", ENC), c("3G estricto: rendimiento", ENC), c("LCP 3G", ENC)],
    ...PAGS.map(([k, n]) => [c(n), c(STD[k].rendimiento, { bold: true, color: STD[k].rendimiento >= 90 ? HEX.accent3 : HEX.accent1 }), c(seg(STD[k].lcp)), c(`${Math.round(STD[k].tbt)} ms`), c(num(STD[k].cls, 3)), c(G3[k].rendimiento), c(seg(G3[k].lcp))]),
  ], { x: 0.5, y: 1.45, w: 12.3, colW: [2.0, 2.0, 1.4, 1.4, 1.3, 2.4, 1.8], fontSize: 14, color: HEX.dk1, align: "center", border: { type: "solid", color: HEX.accent2, pt: 0.75 }, rowH: 0.55 });
  tarjeta(s, 0.5, 4.55, 6.0, 2.1, "Perfil estándar (PageSpeed)", "RTT 150 ms · 1,6 Mbps · CPU 4×. Mediana de 3 corridas. Catálogo con 12 productos + «Mostrar más» para bajar el TBT.", { tam: 13 });
  tarjeta(s, 6.8, 4.55, 6.0, 2.1, "Perfil 3G estricto (auditoría)", "RTT 300 ms · 700 kbps · CPU 4×. El LCP supera 2,5 s, igual que en la auditoría de Café Chiquitano: lo domina el JavaScript del framework.", { oscuro: true, tam: 13 });

  // 16. Discusión ----------------------------------------------
  s = nueva("Discusión · ¿Resuelve el problema contextual?", "Discusión");
  s.addTable([
    [c("Aspecto", ENC), c("Antes", ENC), c("Con la plataforma", ENC)],
    [c("Alcance"), c("Barrio, WhatsApp y ferias"), c("Toda la ciudad con un enlace propio")],
    [c("Precio"), c("Lo fija el intermediario"), c("Lo fija el productor · comisión 0 %")],
    [c("Pedidos"), c("Mensajes sueltos"), c("Panel con estados y ventas del día")],
    [c("Pago"), c("Efectivo, a veces a 30 días"), c("Directo al productor (QR o efectivo)")],
    [c("Confianza"), c("No se sabe quién produce"), c("Historia, barrio, perfil revisado")],
  ], { x: 0.5, y: 1.4, w: 7.2, colW: [1.5, 2.6, 3.1], fontSize: 12.5, color: HEX.dk1, border: { type: "solid", color: HEX.accent2, pt: 0.75 }, rowH: 0.5 });
  const ODS = [["ODS 4", "Aprender a vender en línea"], ["ODS 8", "Precio justo y cobro directo"], ["ODS 9", "Infraestructura digital segura"], ["ODS 10", "Periferia = mismo mercado"]];
  ODS.forEach(([o, t], i) => {
    const x = 7.95 + (i % 2) * 2.45, y = 1.4 + Math.floor(i / 2) * 1.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.3, h: 1.35, fill: { color: HEX.dk2 }, rectRadius: 0.1, line: { type: "none" } });
    s.addText([{ text: o, options: { bold: true, fontSize: 18, color: HEX.accent5, breakLine: true, fontFace: "Cambria" } }, { text: t, options: { fontSize: 11.5, color: "FFFFFF" } }], { x: x + 0.1, y, w: 2.1, h: 1.35, align: "center", valign: "middle", margin: 0, isTextBox: true });
  });
  tarjeta(s, 0.5, 4.65, 12.3, 2.0, "Limitaciones y trabajo futuro", "QR referencial (sin pasarela real) · emprendedores ficticios, sin piloto aún · fotos por URL · cuotas del plan gratuito · LCP en 3G.  →  Piloto con 5–10 emprendedores reales, QR interoperable de cada productor, subida de fotos, PWA sin conexión e indicadores por barrio.", { tam: 13 });

  // 17. Conclusiones -------------------------------------------
  s = nueva("Conclusiones y recomendaciones", "Conclusiones y demo");
  s.addText(viñetas([
    "Sí es viable: plataforma de comercio justo publicada con servicios gratuitos (TiDB Cloud, Vercel, GitHub).",
    `Cumple los 12 requisitos funcionales: ${PRUEBAS.pasan}/${PRUEBAS.total} pruebas y una compra real sobre la URL pública.`,
    `Rendimiento móvil estándar ≥ ${Math.min(...PAGS.map(([k]) => STD[k].rendimiento))} y seguridad OWASP ampliada (roles, IDOR, CSRF, fuerza bruta, bcrypt).`,
    "El impacto económico real debe medirse en un piloto con microemprendedores.",
  ]), { x: 0.5, y: 1.4, w: 7.3, h: 5.2, fontSize: 16, color: HEX.dk2, valign: "top", paraSpaceAfter: 14, isTextBox: true });
  tarjeta(s, 8.1, 1.4, 4.7, 5.2, "Recomendaciones", "• Validar con un barrio real y acompañamiento presencial.\n• Aliado institucional para mantener la comisión en 0 %.\n• Pasarela regulada + nueva auditoría antes de cobrar en línea.\n• Conectar GitHub con Vercel y respaldar la base.\n• Mantener pruebas y Lighthouse en cada entrega.", { oscuro: true, tam: 14 });

  // 18. Demo / QR ----------------------------------------------
  s = pres.addSlide({ masterName: "Oscuro", sectionTitle: "Conclusiones y demo" });
  s.addText("¡Pruébala ahora!", { x: 0.7, y: 0.8, w: 7, h: 1.0, fontFace: "Cambria", fontSize: 44, bold: true, color: "FFFFFF", margin: 0, isTextBox: true });
  s.addText([{ text: URL, options: { hyperlink: { url: URL }, color: HEX.accent5 } }], { x: 0.7, y: 1.9, w: 7.5, h: 0.5, fontSize: 20, bold: true, margin: 0, isTextBox: true });
  s.addText(viñetas([
    "Cliente: catálogo → filtra por barrio → agrega de 2 emprendedores → confirma",
    "Emprendedor: cafechiquitano@mercadojusto.test → Mis pedidos → «Empezar a preparar»",
    "Administrador: admin@mercadojusto.test → aprueba una solicitud nueva",
    "Código: github.com/lixinrodriguez1-eng/mercado-justo-cruceno",
  ]), { x: 0.7, y: 2.8, w: 7.4, h: 3.0, fontSize: 15, color: HEX.lt2, valign: "top", paraSpaceAfter: 10, isTextBox: true });
  s.addText("Gracias · Ismael Franco Ruíz · Lizeth Adela Rodríguez Padilla", { x: 0.7, y: 6.3, w: 8, h: 0.4, fontSize: 13, color: HEX.accent2, margin: 0, isTextBox: true });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.75, y: 1.0, w: 4.0, h: 4.75, fill: { color: "FFFFFF" }, rectRadius: 0.12, line: { type: "none" }, shadow: sombra() });
  imagen(s, QR, 9.0, 1.2, 3.5, 3.5, { hyperlink: { url: URL } });
  s.addText("Escanea con tu celular", { x: 8.75, y: 4.85, w: 4.0, h: 0.5, fontSize: 15, bold: true, color: HEX.dk1, align: "center", isTextBox: true });
  s.addNotes("Demostración en vivo: hacemos una compra a dos emprendedores, entramos como Café Chiquitano para cambiar el estado y como administrador para aprobar una solicitud. Las contraseñas de prueba se entregan aparte.");

  await pres.writeFile({ fileName: SALIDA });
  console.log("✓", SALIDA);
})();
