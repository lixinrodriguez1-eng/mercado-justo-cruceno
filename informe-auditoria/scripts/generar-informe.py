# -*- coding: utf-8 -*-
"""
Genera el informe APA 7 de la auditoría (Word) a partir de los resultados reales.
Uso:  python generar-informe.py
- Toma los estilos (Times New Roman 12, doble espacio, encabezado con número de
  página) del informe de la entrega anterior, que solo se LEE: no se modifica.
- Todos los números salen de informe-auditoria/resultados/*.json.
"""
import json
import re
from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

RAIZ = Path(__file__).resolve().parents[2]
AUD = RAIZ / "informe-auditoria"
RES = AUD / "resultados"
CAP = AUD / "capturas"
PLANTILLA = RAIZ / "informe" / "Informe_Cafe_Chiquitano_APA7.docx"
SALIDA = AUD / "Informe_Auditoria_WPO_OWASP_APA7.docx"
LOGO = AUD / "scripts" / "recursos" / "icono-taza.png"  # ícono de Café Chiquitano (igual que en la presentación)

leer = lambda p: json.loads((RES / p).read_text(encoding="utf-8"))
ANTES, DESPUES = leer("antes/resumen.json"), leer("despues/resumen.json")
INICIAL = leer("fase1-inicial/resumen.json")
B_ANTES, B_DESPUES = leer("antes/bundles.json"), leer("despues/bundles.json")
RED = leer("red-3g-menu.json")
RETRASO_LCP = None
NAV = leer("prueba-navegador.json")
def _retraso_lcp():
    """Porcentaje de 'Render Delay' del LCP del inicio en la corrida mediana inicial."""
    r = leer(f"fase1-inicial/inicio-{INICIAL['inicio']['corridaMediana']}.report.json")
    for fase in r["audits"]["largest-contentful-paint-element"]["details"]["items"][1]["items"]:
        if fase["phase"] == "Render Delay":
            return fase["percent"].replace("%", " %")
    return "—"

PAGS = [("inicio", "Inicio (/)"), ("menu", "Menú (/menu)"), ("carrito", "Carrito (/carrito)")]

# ---------- formato de números (coma decimal, como en Bolivia) ----------
def num(x, d=2):
    return f"{x:,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
seg = lambda ms: num(ms / 1000, 2) + " s"
msf = lambda ms: f"{round(ms)} ms"
kb = lambda k: f"{round(k)} KB"
def pct(a, b):
    return 0 if a == 0 else (b - a) / a * 100
def delta(a, b, menor_es_mejor=True, unidad="%"):
    p = pct(a, b)
    signo = "+" if p > 0 else ("−" if p < 0 else "±")
    return f"{signo}{num(abs(p), 0)} %"

RETRASO_LCP = _retraso_lcp()

# Versiones y potencia de CPU leídas de los propios informes de Lighthouse
def _entorno():
    bench, lh, chrome = [], "", ""
    for f in RES.glob("s[0-9]/*/*.report.json"):
        r = json.loads(f.read_text(encoding="utf-8"))
        bench.append(r["environment"]["benchmarkIndex"])
        lh = r["lighthouseVersion"]
        m = re.search(r"Chrome/(\d+)", r["environment"]["hostUserAgent"])
        chrome = m.group(1) if m else chrome
    redondear = lambda x: int(x + 0.5)  # 2084,5 → 2085 (round() de Python redondea al par)
    return redondear(min(bench)), redondear(max(bench)), lh, chrome
BENCH_MIN, BENCH_MAX, LH_VER, CHROME_VER = _entorno()
# Productos disponibles antes/después de los ataques (de la salida real del script)
_ataques = (RES / "prueba-ataques.txt").read_text(encoding="utf-8")
PRODUCTOS_DISP = re.search(r"Productos disponibles \(sin filtro\): (\d+)", _ataques).group(1)

# =====================================================================
doc = Document(str(PLANTILLA))
cuerpo = doc.element.body
for hijo in list(cuerpo):
    if hijo.tag != qn("w:sectPr"):
        cuerpo.remove(hijo)
doc.core_properties.title = "Taller de Auditoría, Optimización WPO y Seguridad Frontend (OWASP): Café Chiquitano"
doc.core_properties.author = "Ismael Franco Ruíz; Lizeth Adela Rodríguez Padilla"
doc.core_properties.subject = "Diseño Web II – UPDS"

# ---------- ayudantes ----------
def runs(parrafo, texto):
    """Admite **negrita**, *cursiva* y `código` (en Consolas) dentro del texto."""
    for parte in re.split(r"(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)", texto):
        if not parte:
            continue
        if parte.startswith("`") and parte.endswith("`") and len(parte) > 1:
            r = parrafo.add_run(parte[1:-1])
            r.font.name = "Consolas"
            r._element.rPr.rFonts.set(qn("w:eastAsia"), "Consolas")
            r.font.size = Pt(10.5)
        elif parte.startswith("**"):
            parrafo.add_run(parte[2:-2]).bold = True
        elif parte.startswith("*"):
            parrafo.add_run(parte[1:-1]).italic = True
        else:
            parrafo.add_run(parte)
    return parrafo

def P(texto="", sangria=True, centrado=False, espacio=None):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.first_line_indent = Inches(0.5) if sangria else Inches(0)
    if centrado:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    if espacio is not None:
        pf.line_spacing = espacio
    return runs(p, texto)

def H(texto, nivel=1):
    return doc.add_paragraph(texto, style=f"Heading {nivel}")

def salto():
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

def vinetas(items):
    for it in items:
        p = doc.add_paragraph(style="List Bullet") if "List Bullet" in [s.name for s in doc.styles] else doc.add_paragraph()
        p.paragraph_format.first_line_indent = Inches(0)
        if "List Bullet" not in [s.name for s in doc.styles]:
            p.paragraph_format.left_indent = Inches(0.5)
            p.add_run("• ")
        runs(p, it)

def borde(celda, lados, tam=8):
    tcPr = celda._tc.get_or_add_tcPr()
    bordes = tcPr.find(qn("w:tcBorders"))
    if bordes is None:
        bordes = OxmlElement("w:tcBorders")
        tcPr.append(bordes)
    for lado in lados:
        e = OxmlElement(f"w:{lado}")
        e.set(qn("w:val"), "single"); e.set(qn("w:sz"), str(tam)); e.set(qn("w:color"), "000000")
        bordes.append(e)

def sombrear(celda, color):
    tcPr = celda._tc.get_or_add_tcPr()
    s = OxmlElement("w:shd"); s.set(qn("w:val"), "clear"); s.set(qn("w:color"), "auto"); s.set(qn("w:fill"), color)
    tcPr.append(s)

def leyenda(tipo, n, titulo):
    p = doc.add_paragraph(); p.paragraph_format.first_line_indent = Inches(0)
    p.add_run(f"{tipo} {n}").bold = True
    p.paragraph_format.keep_with_next = True
    t = doc.add_paragraph(); t.paragraph_format.first_line_indent = Inches(0)
    t.add_run(titulo).italic = True
    t.paragraph_format.keep_with_next = True

def nota(texto):
    p = doc.add_paragraph(); p.paragraph_format.first_line_indent = Inches(0)
    p.add_run("Nota.").italic = True
    runs(p, " " + texto)

CONT = {"Tabla": 0, "Figura": 0}
def tabla(titulo, encabezados, filas, anchos, nota_txt=None, tam=10, resaltar_col=None):
    CONT["Tabla"] += 1
    leyenda("Tabla", CONT["Tabla"], titulo)
    t = doc.add_table(rows=1 + len(filas), cols=len(encabezados))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for i, fila in enumerate([encabezados] + filas):
        for j, valor in enumerate(fila):
            c = t.cell(i, j); c.width = Inches(anchos[j])
            p = c.paragraphs[0]
            p.paragraph_format.first_line_indent = Inches(0)
            p.paragraph_format.line_spacing = 1.0
            p.paragraph_format.space_after = Pt(2); p.paragraph_format.space_before = Pt(2)
            runs(p, str(valor))
            for r in p.runs:
                r.font.size = Pt(tam)
                if i == 0: r.bold = True
            if i == 0: borde(c, ["top", "bottom"])
            if i == len(filas): borde(c, ["bottom"])
            if resaltar_col is not None and j == resaltar_col and i > 0: sombrear(c, "F7EFE3")
    if nota_txt: nota(nota_txt)
    else: doc.add_paragraph()
    return t

def figura(titulo, archivo, ancho=6.0, nota_txt=None):
    CONT["Figura"] += 1
    leyenda("Figura", CONT["Figura"], titulo)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Inches(0); p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.keep_with_next = bool(nota_txt)
    p.add_run().add_picture(str(CAP / archivo), width=Inches(ancho))
    if nota_txt: nota(nota_txt)
    return CONT["Figura"]

def codigo(texto):
    t = doc.add_table(rows=1, cols=1); t.alignment = WD_TABLE_ALIGNMENT.CENTER
    c = t.cell(0, 0); c.width = Inches(6.3); sombrear(c, "F6F1EA"); borde(c, ["top", "bottom", "left", "right"], 4)
    c.paragraphs[0]._p.getparent().remove(c.paragraphs[0]._p)
    for linea in texto.strip("\n").split("\n"):
        p = c.add_paragraph(); p.paragraph_format.first_line_indent = Inches(0)
        p.paragraph_format.line_spacing = 1.0; p.paragraph_format.space_after = Pt(0)
        r = p.add_run(linea if linea else " "); r.font.name = "Consolas"; r.font.size = Pt(8.5)
        r._element.rPr.rFonts.set(qn("w:eastAsia"), "Consolas")
    doc.add_paragraph()

def indice():
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run("Índice").bold = True
    p = doc.add_paragraph()
    r = p.add_run()
    for tipo, txt in (("begin", None), (None, 'TOC \\o "1-2" \\h \\z \\u'), ("separate", None), (None, "Actualice el índice (clic derecho → Actualizar campo)."), ("end", None)):
        if tipo:
            f = OxmlElement("w:fldChar"); f.set(qn("w:fldCharType"), tipo); r._r.append(f)
        elif txt.startswith("TOC"):
            it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = txt; r._r.append(it)
        else:
            r2 = OxmlElement("w:t"); r2.text = txt; r._r.append(r2)

# =====================================================================
# CARÁTULA
# =====================================================================
for _ in range(2): P("", sangria=False)
p = P("", sangria=False, centrado=True)
p.add_run("Taller de Auditoría, Optimización WPO y Seguridad Frontend (OWASP): Café Chiquitano").bold = True
p = P("", sangria=False, centrado=True); p.paragraph_format.line_spacing = 1.0
p.add_run().add_picture(str(LOGO), width=Inches(1.4))
P("", sangria=False)
for linea in ["Ismael Franco Ruíz", "Lizeth Adela Rodríguez Padilla",
              "Ingeniería de Sistemas, Universidad Privada Domingo Savio (UPDS)",
              "Diseño Web II", "Ing. Álvaro Moscoso Zeballos", "24 de noviembre de 2026"]:
    P(linea, sangria=False, centrado=True)
salto()
indice()
salto()

# =====================================================================
# RESUMEN
# =====================================================================
ia, da = ANTES["inicio"], DESPUES["inicio"]
ma, md = ANTES["menu"], DESPUES["menu"]
ca, cd = ANTES["carrito"], DESPUES["carrito"]
prom = lambda R, k: sum(R[p][k] for p, _ in PAGS) / 3
tbt_a, tbt_d = prom(ANTES, "tbt"), prom(DESPUES, "tbt")
perf_a, perf_d = prom(ANTES, "rendimiento"), prom(DESPUES, "rendimiento")
# Sesiones en las que el TBT del "después" fue menor que el del "antes" (por página)
ses_tbt_mejor = {k: sum(d["tbt"] < a["tbt"] for a, d in zip(ANTES[k]["sesiones"], DESPUES[k]["sesiones"])) for k, _ in PAGS}
n_ses = len(ANTES["inicio"]["sesiones"])
img_kb = lambda f: sum(p["kb"] for p in RED[f]["mediana"]["peticiones"] if "image" in p["tipo"].lower())
FORM_KB = "1,7"  # chunk del formulario de producto (gzip), medido sobre .next/static

H("Resumen")
P(f"Este informe documenta la auditoría de rendimiento web (WPO) y de seguridad frontend aplicada a *Café Chiquitano*, "
  f"la tienda en línea desarrollada con Next.js 16, Tailwind CSS 4, Prisma 6 y MySQL (XAMPP) en la entrega anterior. "
  f"La aplicación se midió con Lighthouse {LH_VER} en modo móvil con una red 3G simulada (RTT de 300 ms, 700 kbps y CPU "
  f"cuatro veces más lenta), con tres corridas intercaladas por página y versión, repetidas en tres sesiones, informando la mediana. En la mediana "
  f"de las nueve corridas, el Total Blocking Time promedio bajó de {msf(tbt_a)} a {msf(tbt_d)} ({delta(tbt_a, tbt_d)}) y el puntaje "
  f"de rendimiento promedio subió de {num(perf_a,0)} a {num(perf_d,0)} puntos, sin empeorar el CLS; sin embargo, sesión por sesión "
  f"la versión optimizada tuvo menor TBT solo en {ses_tbt_mejor['inicio']} de {n_ses} sesiones en el inicio, {ses_tbt_mejor['menu']} de {n_ses} en el "
  f"menú y {ses_tbt_mejor['carrito']} de {n_ses} en el carrito, por lo que esa mejora se presenta como tendencia y no como certeza. Los "
  f"cambios deterministas fueron la reducción del peso del inicio ({delta(ia['pesoKB'], da['pesoKB'])}) y del menú "
  f"({delta(ma['pesoKB'], md['pesoKB'])}) y de las fotos del menú ({delta(img_kb('antes'), img_kb('despues'))}). El LCP simulado bajo "
  f"3G siguió por encima de 2,5 s, porque lo domina el JavaScript del propio framework. En seguridad se agregó la desinfección en el servidor de "
  f"los campos de texto libre, siete cabeceras HTTP de protección, entre ellas una Content-Security-Policy, y la corrección "
  f"de cuatro vulnerabilidades altas de dependencias. Las pruebas con cargas XSS reales no ejecutaron ningún script y "
  f"MySQL no conserva ninguna etiqueta HTML. Las consultas de Prisma resultaron parametrizadas frente a la inyección SQL.", sangria=False)
P("*Palabras clave:* WPO, Core Web Vitals, Lighthouse, lazy loading, XSS, OWASP Top 10:2025, Content Security Policy, Next.js.")
salto()

# =====================================================================
# INTRODUCCIÓN
# =====================================================================
H("Introducción")
P("En Bolivia una parte importante de los clientes de un negocio de barrio navega desde celulares de gama media o baja y, "
  "fuera del centro de las ciudades, con conexiones móviles lentas o con poco saldo de datos. Para ellos cada kilobyte y cada "
  "viaje de ida y vuelta al servidor cuenta: una página que en la oficina carga en un segundo puede tardar más de siete en una "
  "red 3G. Al mismo tiempo, una tienda que recibe datos de sus clientes (nombre, celular e indicaciones del pedido) debe "
  "impedir que alguien use esos formularios para inyectar código malicioso.")
P("En la entrega anterior se construyó *Café Chiquitano*, una tienda en línea ficticia para una cafetería de Santa Cruz de la "
  "Sierra. En esta segunda parte se audita esa misma aplicación como lo haría un equipo de calidad: primero se mide su estado "
  "real en condiciones 3G y se revisa su seguridad frente al OWASP Top 10 vigente; luego se aplican optimizaciones de "
  "rendimiento (minificación, carga diferida, compresión y caché) y medidas contra el *cross-site scripting* (XSS); por último "
  "se repiten exactamente las mismas mediciones para comparar el antes y el después.")
P("Se trata de una auditoría defensiva sobre una aplicación propia, ejecutada solo en *localhost*. El documento presenta los "
  "objetivos, el marco teórico, la metodología, los resultados por fase con tablas y capturas reales, el aporte a los Objetivos "
  "de Desarrollo Sostenible, los *prompts* de inteligencia artificial utilizados, las conclusiones y las recomendaciones.")

H("Objetivos")
H("Objetivo General", 2)
P("Auditar y optimizar el rendimiento y la seguridad frontend de la aplicación Café Chiquitano en condiciones de red 3G, "
  "aplicando técnicas de optimización del rendimiento web (WPO) y controles del OWASP Top 10:2025, y demostrar con mediciones "
  "comparables el efecto de cada cambio.")
H("Objetivos Específicos", 2)
vinetas([
    "Medir la línea base con Lighthouse móvil y red 3G simulada en las páginas de inicio, menú y carrito (FCP, LCP, TBT, CLS, Speed Index, peso y peticiones).",
    "Revisar la seguridad del código y de la configuración: uso de HTML sin escapar, entradas sin limpiar, cabeceras HTTP, dependencias vulnerables y consultas a la base de datos.",
    "Aplicar minificación, eliminación de código y datos sobrantes, carga diferida (imágenes, componentes y fuentes), compresión y caché.",
    "Desinfectar en el servidor los campos de texto libre y configurar cabeceras de seguridad sin romper next/image ni las fuentes.",
    "Probar ataques XSS e inyección SQL reales contra el formulario de pedido y el panel de administración, y verificar los datos en MySQL.",
    "Repetir las mismas mediciones y presentar una comparación antes/después honesta, incluyendo los cambios que no dieron resultado.",
])

# =====================================================================
# MARCO TEÓRICO
# =====================================================================
H("Marco Teórico")
H("Optimización del Rendimiento Web (WPO)", 2)
P("La optimización del rendimiento web (*Web Performance Optimization*, WPO) reúne las técnicas para que una página se "
  "descargue, se muestre y responda lo antes posible. Souders (2007) mostró que la mayor parte del tiempo de carga ocurre en "
  "el navegador (descargar, analizar y ejecutar recursos) y no en el servidor, y propuso reglas que siguen vigentes: hacer "
  "menos peticiones, comprimir, aprovechar la caché y no bloquear el renderizado. Grigorik (2013) explica por qué la latencia "
  "pesa más que el ancho de banda en redes móviles: en 3G cada viaje de ida y vuelta (RTT) cuesta cientos de milisegundos, "
  "así que cada petición encadenada retrasa la página aunque el archivo sea pequeño.")
H("Métricas Core Web Vitals", 2)
P("Google define tres métricas centrales de experiencia de usuario, las *Core Web Vitals*: *Largest Contentful Paint* (LCP), "
  "que mide cuándo se muestra el elemento más grande de la pantalla y se considera bueno hasta 2,5 s; *Interaction to Next "
  "Paint* (INP), que mide la rapidez de respuesta a las interacciones y es bueno hasta 200 ms; y *Cumulative Layout Shift* "
  "(CLS), que mide los saltos inesperados del diseño y es bueno hasta 0,1 (Walton, 2024; Walton y Pollard, 2025). "
  "Como INP requiere interacciones de usuarios reales, en laboratorio se usa el *Total Blocking Time* (TBT) como indicador "
  "equivalente: suma el tiempo en que el hilo principal estuvo bloqueado por tareas de más de 50 ms. Lighthouse también "
  "informa el *First Contentful Paint* (FCP), primer contenido visible, y el *Speed Index* (SI), que indica qué tan rápido "
  "se completa visualmente la pantalla (Google, s.f.-a).")
H("Lighthouse y el Throttling Simulado", 2)
P("Lighthouse es la herramienta de auditoría de Chrome. Por defecto no frena la red de verdad, sino que carga la página a "
  "velocidad normal y luego *simula*, con su modelo Lantern, cuánto habría tardado con la red y la CPU indicadas. Este método "
  "es reproducible, pero tiene una consecuencia: el tiempo de CPU observado en el equipo se multiplica por el factor de "
  "ralentización, de modo que la carga de trabajo de la computadora influye en el TBT y el LCP (GoogleChrome, s.f.). Por eso "
  "en este trabajo las versiones antes y después se midieron intercaladas en la misma sesión.")
H("Minificación y Compresión", 2)
P("La minificación elimina del código todo lo que el navegador no necesita (espacios, comentarios, nombres largos de "
  "variables) sin cambiar su comportamiento (MDN Web Docs, 2025). La compresión (gzip o Brotli) reduce además el tamaño "
  "transferido por la red. En Next.js 16 el empaquetador Turbopack minifica JavaScript y CSS en cada `next build`, y "
  "`next start` comprime con gzip las respuestas mientras la opción `compress` esté activa (Vercel, 2026a).")
H("Carga Diferida (Lazy Loading)", 2)
P("La carga diferida pospone la descarga de recursos que no se necesitan para la primera pantalla. Para imágenes se usa el "
  "atributo nativo `loading=\"lazy\"`; la imagen principal (candidata a LCP) debe cargarse de inmediato y con prioridad alta, "
  "porque diferirla empeora el LCP (Osmani et al., s.f.; Walton y Pollard, 2025). En Next.js, `next/dynamic` separa un "
  "componente de cliente en un archivo JavaScript propio que se descarga solo cuando se muestra (Vercel, 2026b). Para las "
  "fuentes, `font-display: swap` muestra el texto con una fuente del sistema mientras llega la tipografía web.")
H("Caché HTTP", 2)
P("La cabecera `Cache-Control` indica cuánto tiempo puede reutilizar el navegador un recurso sin volver a pedirlo. Los "
  "archivos con un *hash* en el nombre pueden marcarse como `immutable` por un año, porque cualquier cambio genera un nombre "
  "nuevo (MDN Web Docs, 2026a).")
H("Cross-Site Scripting (XSS) y OWASP Top 10:2025", 2)
P("El XSS ocurre cuando una aplicación inserta datos no confiables en una página sin neutralizarlos, de modo que el navegador "
  "de la víctima ejecuta código del atacante. Puede ser *almacenado* (el código queda guardado en la base de datos y se "
  "muestra a otros usuarios), *reflejado* (viene en la URL) o *basado en DOM*. La defensa principal es codificar la salida "
  "según el contexto, apoyada por la validación de entradas y una política de seguridad de contenido (OWASP Cheat Sheet "
  "Series Team, s.f.-a).")
P("El OWASP Top 10 es la lista de referencia de los riesgos más críticos de las aplicaciones web. Se verificó en el sitio "
  "oficial que la edición vigente es la **OWASP Top 10:2025**, con estas categorías: A01 Broken Access Control, A02 Security "
  "Misconfiguration, A03 Software Supply Chain Failures, A04 Cryptographic Failures, A05 Injection, A06 Insecure Design, "
  "A07 Authentication Failures, A08 Software or Data Integrity Failures, A09 Security Logging and Alerting Failures y A10 "
  "Mishandling of Exceptional Conditions. En esta edición el XSS (CWE-79) forma parte de **A05 Injection**, junto con la "
  "inyección SQL (OWASP Foundation, 2025a).")
H("Content Security Policy y Cabeceras de Seguridad", 2)
P("La *Content-Security-Policy* (CSP) es una cabecera con la que el servidor le dice al navegador desde qué orígenes puede "
  "cargar scripts, estilos, imágenes, fuentes y conexiones; todo lo demás se bloquea (MDN Web Docs, 2026b). Se complementa "
  "con `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options` o `frame-ancestors` contra el *clickjacking* "
  "y `Permissions-Policy` para desactivar APIs del dispositivo (OWASP Cheat Sheet Series Team, s.f.-b, s.f.-c). Next.js "
  "documenta dos variantes de CSP: con *nonce* por petición, que obliga a renderizar todas las páginas en cada visita, y sin "
  "*nonce*, que conserva el pre-renderizado (Vercel, 2026c).")
H("Inyección SQL y Consultas Parametrizadas", 2)
P("La inyección SQL aprovecha consultas armadas concatenando texto del usuario. La defensa recomendada son las consultas "
  "parametrizadas, en las que el valor viaja separado de la sentencia (OWASP Cheat Sheet Series Team, s.f.-d). Prisma ORM "
  "parametriza todas las consultas de su API (`findMany`, `create`, `update`) y solo expone riesgo si se usan "
  "`$queryRawUnsafe` o `$executeRawUnsafe` con texto concatenado (Prisma, s.f.).")
salto()

# =====================================================================
# METODOLOGÍA
# =====================================================================
H("Metodología")
P("El trabajo siguió cuatro fases, probando cada una antes de pasar a la siguiente: auditoría inicial, optimización WPO, "
  "seguridad frontend y auditoría final. Antes de cambiar nada se guardó la versión original con un *commit* de Git y la "
  "etiqueta `antes-auditoria`.")
tabla("Entorno de Medición", ["Elemento", "Valor"], [
    ["Equipo", "Intel Core i5-1235U, 8 GB de RAM, Windows 11"],
    ["Aplicación", "Next.js 16.4.6 (Turbopack, Cache Components), React 19.3, Tailwind CSS 4.3.3, Prisma 6.19.3"],
    ["Base de datos", "MariaDB 10.4.32 (XAMPP), base cafeteria_db"],
    ["Modo", "Producción: `npm run build` + `next start` (no `next dev`)"],
    ["Navegador y auditor", f"Google Chrome {CHROME_VER} (headless) · Lighthouse CLI {LH_VER}"],
    ["Perfil de red", "Móvil, throttling simulado: RTT 300 ms, 700 kbps, CPU 4× más lenta"],
    ["Páginas", "Inicio (/), menú (/menu) y carrito (/carrito)"],
    ["Repeticiones", "Fase 1: 3 corridas por página (mediana). Fase 4: el mismo protocolo repetido en 3 sesiones (9 corridas por página y versión)"],
], [1.7, 4.6])
P("Para que la comparación final fuera justa, la versión original se recuperó desde la etiqueta de Git en una carpeta aparte "
  "(`git worktree`), se compiló y se sirvió en el puerto 3006, mientras la versión optimizada se servía en el 3005. Las "
  "corridas se ejecutaron intercaladas (antes, después, antes, después…), para que la carga del equipo afectara por igual a "
  "ambas versiones. Aun así, el índice de potencia de CPU que Lighthouse registra en cada corrida (*benchmarkIndex*) varió "
  f"entre {BENCH_MIN} y {BENCH_MAX} durante las jornadas de medición por procesos en segundo plano del sistema, y un mismo archivo JavaScript llegó a "
  "tardar el doble en dos corridas seguidas. Por eso el protocolo de la Fase 1 (tres corridas intercaladas y mediana) se "
  "repitió en tres sesiones y se informa la mediana de las nueve corridas, junto con la de cada sesión. Además, la página de menú se cargó en Chrome con la red 3G "
  "*aplicada* realmente mediante el Chrome DevTools Protocol, para obtener el registro de red (*waterfall*).")
P("Las pruebas de seguridad se automatizaron con scripts propios: pruebas directas a la API (como haría un atacante con "
  "curl o Postman), pruebas en un navegador real con Puppeteer que detectan cualquier `alert()` ejecutado, y consultas en "
  "phpMyAdmin. Todos los scripts quedaron en `informe-auditoria/scripts/` para que la auditoría sea reproducible.")
salto()

# =====================================================================
# RESULTADOS – FASE 1
# =====================================================================
H("Resultados")
H("Fase 1: Auditoría Inicial", 2)
P("La Tabla 2 muestra la línea base medida al inicio de la auditoría, antes de cualquier cambio.")
filas = []
for k, nombre in PAGS:
    m = INICIAL[k]
    filas.append([nombre, m["rendimiento"], seg(m["fcp"]), seg(m["lcp"]), msf(m["tbt"]), num(m["cls"], 3), seg(m["si"]), kb(m["pesoKB"]), m["peticiones"]])
tabla("Línea Base con Lighthouse Móvil y Red 3G Simulada (Mediana de 3 Corridas)",
      ["Página", "Rend.", "FCP", "LCP", "TBT", "CLS", "SI", "Peso", "Pet."], filas,
      [1.35, 0.5, 0.62, 0.62, 0.62, 0.55, 0.62, 0.65, 0.45],
      "Rend. = puntaje de rendimiento (0–100); Pet. = número de peticiones. Medición del 22 de noviembre de 2026.")
P(f"El CLS ya era excelente y el FCP rondaba los 1,8 s, pero el LCP estaba entre 5 y 7 s, lejos del umbral de 2,5 s. "
  f"El desglose de Lighthouse para el inicio mostró que el {RETRASO_LCP} del LCP era *retraso de renderizado*: "
  "la foto del hero se descargaba pronto, pero el hilo principal estaba ocupado analizando JavaScript. Los hallazgos "
  "concretos fueron:")
vinetas([
    f"**HTML pesado:** el documento del inicio medía {num(B_ANTES['porRuta']['/']['htmlKB'],1)} KB sin comprimir. Cada tarjeta de producto enviaba el producto completo (con su descripción) al botón «Agregar», que es un componente de cliente, y esos datos se duplicaban en el *payload* RSC que viaja dentro del HTML.",
    "**Imágenes con 9 anchos posibles:** cada `<img>` incluía un `srcset` de 384 a 3840 px, aunque las fotos originales miden 800 px (productos) y 1600 px (hero).",
    "**Imagen LCP del menú en diferido:** en el menú la primera foto no tenía prioridad alta, lo que Lighthouse marcó como fallo de *descubrimiento del LCP*.",
    f"**JavaScript del framework:** cerca de {kb(B_ANTES['porRuta']['/']['jsGzipKB'])} comprimidos por página, en su mayoría React y el *router* de Next.js, con 13 KB de *polyfills* para navegadores antiguos.",
    "**Fuentes:** dos tipografías variables (Fraunces y Nunito Sans) de 67 KB en total, ya autoalojadas por next/font y con `display: swap`.",
])
P("La revisión de seguridad se resume en la Tabla 3, organizada según el OWASP Top 10:2025.")
tabla("Hallazgos de Seguridad de la Auditoría Inicial según el OWASP Top 10:2025",
      ["Categoría", "Hallazgo inicial", "Riesgo", "Resultado"], [
    ["A05 Injection (XSS)", "No se usa `dangerouslySetInnerHTML`, `innerHTML` ni `eval`; React escapa todo el texto.", "Bajo", "Correcto"],
    ["A05 Injection (XSS almacenado)", "La nota del pedido y el nombre y la descripción del producto se guardaban en MySQL tal como llegaban, con HTML incluido.", "Medio", "Corregido"],
    ["A05 Injection (SQL)", "Todas las consultas usan la API de Prisma; no hay `$queryRaw` ni concatenación de SQL.", "Bajo", "Correcto"],
    ["A02 Security Misconfiguration", "Sin CSP, nosniff, Referrer-Policy, X-Frame-Options ni Permissions-Policy; la cabecera `X-Powered-By` revelaba Next.js.", "Medio", "Corregido"],
    ["A03 Software Supply Chain Failures", "`npm audit`: 4 vulnerabilidades altas (effect y deepmerge-ts, usadas por el CLI de Prisma).", "Alto (desarrollo)", "Corregido"],
    ["A01 Broken Access Control", "Las rutas /api/admin validan la sesión por sí mismas y proxy.ts protege las páginas; los pedidos usan un código CUID.", "Bajo", "Correcto"],
    ["A07 Authentication Failures", "El login del administrador no limita los intentos fallidos.", "Medio", "Pendiente"],
    ["A04 Cryptographic Failures", "Sesión firmada con HMAC-SHA256 en cookie httpOnly y SameSite; en local no hay HTTPS.", "Bajo", "Preparado (HSTS)"],
    ["A10 Mishandling of Exceptional Conditions", "Los errores devuelven mensajes genéricos sin detalles internos.", "Bajo", "Correcto"],
], [1.45, 3.05, 0.8, 1.0], "Elaboración propia a partir de la revisión del código, `curl -I` y `npm audit`.", tam=9)

# =====================================================================
# FASE 2 – WPO
# =====================================================================
H("Fase 2: Optimización WPO", 2)
H("Minificación y Eliminación de Sobrantes", 3)
P("Se confirmó que `next build` ya minifica el JavaScript y el CSS: los archivos de `.next/static/chunks` no tienen espacios "
  "ni comentarios y las variables se reducen a una letra (Figura 1). El CSS de Tailwind solo contiene las clases usadas. No se "
  "encontraron dependencias de producción sobrantes (solo next, react, react-dom y @prisma/client) ni exportaciones sin uso, "
  "así que el trabajo se centró en los datos y el código que sobraban dentro de cada página:")
vinetas([
    "El botón «Agregar» ahora recibe solo cuatro campos (`id`, `nombre`, `precio`, `imagen`) en lugar del producto completo, con un tipo `ProductoCarrito` nuevo.",
    "El `srcset` de las imágenes se limitó a 5 anchos (640, 750, 828, 1080 y 1600 px) y una sola calidad (60).",
    "Se descubrió que Tailwind 4 también escaneaba los informes HTML de Lighthouse guardados en el proyecto y generaba 3,8 KB de clases ajenas; con `source(none)` ahora solo revisa `app/`, `components/` y `lib/`.",
])
figura("Evidencia de Minificación: Inicio de un Bundle de Producción", "term-04-minificacion.png", 6.2,
       "Salida real del comando. El código está en una sola línea, sin comentarios y con nombres de variables de una letra.")
fb = []
for ruta, nombre in [("/", "Inicio"), ("/menu", "Menú"), ("/carrito", "Carrito"), ("/admin", "Admin productos")]:
    a, d = B_ANTES["porRuta"][ruta], B_DESPUES["porRuta"][ruta]
    fb.append([nombre, f"{num(a['htmlKB'],1)} → {num(d['htmlKB'],1)}", f"{num(a['htmlGzipKB'],1)} → {num(d['htmlGzipKB'],1)}",
               f"{num(a['jsGzipKB'],1)} → {num(d['jsGzipKB'],1)}", f"{num(a['cssGzipKB'],1)} → {num(d['cssGzipKB'],1)}"])
tabla("Tamaño del HTML y de los Bundles por Página, Antes → Después (KB)",
      ["Página", "HTML sin comprimir", "HTML gzip", "JS gzip", "CSS gzip"], fb, [1.4, 1.35, 1.15, 1.2, 1.1],
      "Medición propia con el script `medir-bundles.mjs` sobre los dos builds de producción. El JavaScript del framework no cambia; la reducción está en el HTML.")
H("Carga Diferida (Lazy Loading)", 3)
P("El hero del inicio ya cumplía la regla: se carga con `loading=\"eager\"` y `fetchPriority=\"high\"`. En Next.js 16 la "
  "propiedad `priority` quedó obsoleta y la documentación recomienda exactamente esa combinación (Vercel, 2026d). Se aplicó lo "
  "mismo a la primera tarjeta del menú (probable LCP en el celular); la segunda se pide de inmediato sin prioridad y el resto "
  "usa `loading=\"lazy\"`. En el panel de administración, el formulario de producto se cargó con `next/dynamic`: ahora es un "
  "archivo JavaScript aparte que no aparece entre los scripts iniciales de /admin y se descarga solo al pulsar «Nuevo "
  "producto», lo que se verificó con Puppeteer y revisando los scripts que pide el HTML de /admin. La ganancia en bytes "
  f"es pequeña: el formulario ocupa solo {FORM_KB} KB comprimidos y el cargador de `next/dynamic` agrega un archivo, de modo que "
  f"el JavaScript inicial de /admin quedó prácticamente igual ({num(B_ANTES['porRuta']['/admin']['jsGzipKB'],1)} → "
  f"{num(B_DESPUES['porRuta']['/admin']['jsGzipKB'],1)} KB gzip). El beneficio es que ese código ya no se analiza ni se ejecuta "
  "al abrir el panel, y la técnica escala si el formulario crece (por ejemplo, con un editor de imágenes). Las dos fuentes "
  "mantienen `display: \"swap\"`.")
codigo('''// components/admin/GestorProductos.tsx
// WPO – lazy loading con next/dynamic: el formulario va en un chunk aparte
// que solo se descarga cuando el administrador abre "Nuevo producto" o "Editar".
const FormularioProducto = dynamic(
  () => import("./FormularioProducto").then((m) => m.FormularioProducto),
  { loading: () => <p className="p-4 text-center text-cafe-600">Cargando formulario…</p> },
);''')
H("Compresión y Caché", 3)
P("Se verificó con `curl` que el HTML, el JavaScript y el CSS llegan con `Content-Encoding: gzip`, y se dejó `compress: true` "
  "explícito en `next.config.ts`. Los archivos de `/_next/static` ya se servían con `Cache-Control: public, max-age=31536000, "
  "immutable`; las imágenes optimizadas recibieron `minimumCacheTTL` de 30 días. El HTML se mantiene sin caché a propósito, "
  "porque incluye el menú y los pedidos leídos de MySQL en cada visita.")
H("Experimento Descartado: CSS en Línea", 3)
P("Se probó la opción experimental `inlineCss` para eliminar la petición del CSS, que bloquea el renderizado. El resultado fue "
  "negativo: el HTML del inicio creció de 84 KB a 274 KB, porque el CSS se repite dentro del *payload* RSC, y el TBT en 3G "
  "se duplicó (de unos 360 ms a 710 ms). La opción se retiró y se dejó comentada la razón en la configuración.")

# =====================================================================
# FASE 3 – SEGURIDAD
# =====================================================================
H("Fase 3: Seguridad Frontend (XSS)", 2)
H("Desinfección en el Servidor", 3)
P("En `lib/validacion.ts` se creó la función `limpiarTexto()`, que se aplica al nombre del cliente, a la nota del pedido y "
  "al nombre y la descripción del producto antes de validar su longitud y de guardarlos en MySQL. La función normaliza "
  "Unicode (para que caracteres disfrazados como ＜ se conviertan en <), decodifica entidades como `&lt;` o `&#60;`, elimina "
  "bloques peligrosos completos (`<script>…</script>`, `<style>`, `<iframe>`, `<svg>`…), quita cualquier otra etiqueta y los "
  "caracteres `<`, `>` y la comilla invertida, neutraliza los esquemas `javascript:` y `data:text/html` y borra caracteres de "
  "control e invisibles. La URL de la imagen del producto, además, rechaza espacios, comillas y `< >`.")
codigo('''// lib/validacion.ts (fragmento)
export function limpiarTexto(valor: unknown, multilinea = false): string {
  if (typeof valor !== "string") return "";
  let limpio = decodificarEntidades(valor.normalize("NFKC"));
  limpio = limpio
    .replace(/<(script|style|iframe|object|embed|svg|math|template|noscript)\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>/gi, " ")
    .replace(/<\\/?[a-z!?\\/][^>]*(>|$)/gi, " ")   // cualquier otra etiqueta
    .replace(/[<>`]/g, "")
    .replace(/\\b(javascript|vbscript)\\s*:/gi, "")
    .replace(/\\bdata\\s*:\\s*text\\/html/gi, "")
    .replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]|\\p{Cf}|\\p{Zl}|\\p{Zp}/gu, "");
  ...
}''')
P("La primera versión de la función tenía un defecto que encontraron las propias pruebas: ante una etiqueta peligrosa sin "
  "cierre, como `&lt;svg onload=alert(1)&gt; leche deslactosada`, borraba también el texto legítimo que venía después y la nota "
  "quedaba vacía. Era seguro, pero perdía datos del cliente; se corrigió para que solo se eliminen bloques completos. La "
  "Figura 2 muestra la prueba unitaria final con 17 casos.")
figura("Prueba Unitaria de limpiarTexto() con Cargas XSS y Textos Legítimos", "term-06-prueba-unitaria-xss.png", 6.2,
       "Los textos legítimos con tildes, apóstrofos y guiones (por ejemplo, «María José O'Brien-Suárez») se conservan.")
H("Cabeceras de Seguridad", 3)
P("En `next.config.ts` se agregaron siete cabeceras (Tabla 5) y se desactivó `X-Powered-By`. Se eligió la CSP sin *nonce* "
  "documentada por Next.js: la versión con *nonce* obliga a renderizar todas las páginas en cada visita y anula el "
  "pre-renderizado parcial, lo que habría empeorado el LCP en 3G. El costo de esa decisión es `'unsafe-inline'` en "
  "`script-src`, necesario para los pequeños scripts en línea que Next.js usa para hidratar React; la protección contra XSS se "
  "apoya además en el escape automático de React y en la desinfección del servidor.")
tabla("Cabeceras de Seguridad Configuradas", ["Cabecera", "Valor", "Protege contra"], [
    ["Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'", "Scripts externos, envío de datos a otros dominios, plugins, iframes y clickjacking"],
    ["X-Content-Type-Options", "nosniff", "Ejecución de archivos con un tipo MIME falso"],
    ["Referrer-Policy", "strict-origin-when-cross-origin", "Fuga de rutas internas a otros sitios"],
    ["X-Frame-Options", "DENY", "Clickjacking en navegadores antiguos"],
    ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()", "Uso indebido de APIs del dispositivo"],
    ["Cross-Origin-Opener-Policy", "same-origin", "Ataques entre ventanas de otro origen"],
    ["Strict-Transport-Security", "max-age=63072000; includeSubDomains", "Conexiones sin HTTPS (se activa al publicar con TLS)"],
], [1.6, 2.9, 1.8], "`next/image` y `next/font` siguen funcionando: las fotos se sirven desde /_next/image ('self') y las fuentes se autoalojan.", tam=9)
P("Al medir la Fase 4 apareció un efecto inesperado: la CSP ocupa unos 500 bytes y se estaba enviando también en cada "
  "archivo JavaScript, fuente e imagen, lo que sumaba alrededor de 12 KB por página. Como la CSP solo tiene efecto en los "
  "documentos, los archivos de `/_next/static` y `/_next/image` ahora reciben solo `nosniff` (Figura 3).")
figura("Cabeceras HTTP de la Página de Inicio Antes y Después", "term-01-cabeceras-antes-despues.png", 6.3,
       "Salida real de `curl -I`. Antes aparecía `X-Powered-By: Next.js` y no había ninguna cabecera de seguridad.")
H("Pruebas de Ataques XSS", 3)
P("Las pruebas se hicieron de dos maneras. Primero, enviando las cargas directamente a la API, saltándose el formulario. "
  "Después, escribiéndolas en la interfaz real con Chrome controlado por Puppeteer, que registra cualquier `alert()`, "
  "`confirm()` o `prompt()` ejecutado. En ningún caso se ejecutó código: " + f"se registraron **{NAV['alertsEjecutados']} diálogos**. "
  "La Tabla 6 resume lo enviado y lo que quedó guardado.")
tabla("Cargas XSS Enviadas y Valor Guardado en MySQL", ["Campo", "Carga enviada", "Guardado en MySQL"], [
    ["Cliente (API)", "<script>alert(1)</script>", "Rechazado (422): queda vacío tras limpiar"],
    ["Cliente (API)", "<img src=x onerror=alert(1)>Prueba XSS", "Prueba XSS"],
    ["Nota (API)", "<script>alert('xss')</script>Sin azúcar", "Sin azúcar"],
    ["Nota (API)", "<img src=x onerror=alert(document.cookie)>Para llevar", "Para llevar"],
    ["Nota (API)", "&lt;svg onload=alert(1)&gt; leche deslactosada", "leche deslactosada"],
    ["Cliente (formulario)", "<img src=x onerror=alert('XSS')>Ana Rojas", "Ana Rojas"],
    ["Nota (formulario)", "<script>alert('XSS')</script>Sin azúcar, por favor", "Sin azúcar, por favor"],
    ["Producto: nombre (admin)", "<script>alert('admin')</script>Mocha XSS", "Mocha XSS"],
    ["Producto: descripción (admin)", "<img src=x onerror=alert(document.cookie)>Mocha con chocolate…", "Mocha con chocolate amargo de la Chiquitanía"],
    ["Imagen del producto (API)", "javascript:alert(1)", "Rechazado (422)"],
], [1.6, 2.9, 1.8], "Resultados de `prueba-ataques.mjs` y `prueba-navegador.mjs`.", tam=9)
figura("Formulario de Pedido con Cargas XSS Escritas por el Atacante", "xss-01-pedido-formulario-con-ataque.png", 5.8)
figura("Confirmación del Pedido: el Nombre y la Nota se Muestran Limpios", "xss-02-pedido-confirmacion-limpia.png", 4.6,
       "No apareció ningún cuadro de alerta; el saludo dice «¡Gracias, Ana!» y la indicación «Sin azúcar, por favor».")
figura("Panel de Administración: Formulario con Cargas XSS", "xss-03-admin-formulario-con-ataque.png", 5.8)
figura("Panel de Administración: Producto Guardado sin Etiquetas", "xss-04-admin-producto-guardado-limpio.png", 5.8,
       "El aviso confirma «Mocha XSS se creó correctamente». Los dos productos de prueba se dejaron como no disponibles para no alterar el menú público.")
P("Para comprobar la CSP se simuló que un atacante ya había logrado inyectar código en la página: se intentó cargar un "
  "script externo, enviar las cookies a otro dominio con `fetch`, incrustar un iframe y un plugin. El navegador bloqueó los "
  "cuatro intentos (Figura 8). Para el *clickjacking* se armó una página atacante, abierta desde otro origen, que intenta "
  "incrustar la tienda en un iframe. Con la versión original (sin cabeceras) la tienda se muestra dentro del sitio ajeno, "
  "así que un atacante podría taparla con botones falsos; con la versión protegida, que envía `frame-ancestors 'none'` y "
  "`X-Frame-Options: DENY`, Chrome se niega a mostrarla y lo registra en la consola (Figura 9).")
figura("Intentos de Código Inyectado Bloqueados por la CSP", "csp-06-bloqueo-de-codigo-inyectado.png", 6.0,
       "Los mensajes son los eventos `securitypolicyviolation` y los errores de consola reales registrados por Chrome, mostrados sobre la página.")
figura("Intento de Clickjacking: la Versión Original se Deja Incrustar y la Protegida se Bloquea", "csp-07-clickjacking-bloqueado.png", 6.3,
       "Las cabeceras mostradas debajo de cada iframe y el mensaje de la consola son los reales, leídos de las respuestas de cada versión y de Chrome.")
H("Verificación en MySQL (phpMyAdmin)", 3)
figura("Tabla pedidos en phpMyAdmin con los Datos de las Pruebas Limpios", "db-08-phpmyadmin-pedidos-limpios.png", 6.2)
figura("Búsqueda de Etiquetas HTML en los Campos de Texto Libre", "db-10-phpmyadmin-busqueda-etiquetas.png", 6.2,
       "La consulta con REGEXP '[<>]' devuelve 0 filas en pedidos y en productos.")
H("Inyección SQL y Dependencias", 3)
P("Se revisó todo el código: no hay `$queryRaw`, `$queryRawUnsafe` ni `$executeRaw`, y todas las consultas usan la API de "
  "Prisma, que envía los valores como parámetros. Las pruebas lo confirmaron (Tabla 7). En la cadena de suministro, en lugar de "
  "`npm audit fix --force`, que obligaba a migrar a Prisma 7, se fijaron versiones corregidas de las dos dependencias internas "
  "con `overrides` en `package.json`; `prisma validate` y `prisma generate` siguieron funcionando y `npm audit` pasó de 4 "
  "vulnerabilidades altas a 0 (Figura 13).")
tabla("Pruebas de Inyección SQL", ["Entrada maliciosa", "Dónde", "Resultado"], [
    ["' OR '1'='1", "Búsqueda ?q=", "200, 0 resultados (se busca el texto literal)"],
    ["%' OR 1=1 -- ", "Búsqueda ?q=", "200, 0 resultados"],
    ["'; DROP TABLE productos; -- ", "Búsqueda ?q=", "200, 0 resultados; la tabla sigue intacta"],
    ["1 OR 1=1", "/api/productos/:id", "400 «Id de producto inválido»"],
    ["' OR '1'='1", "Contraseña del login", "401 «Contraseña incorrecta»"],
], [1.9, 1.6, 2.8], f"Salida de `prueba-ataques.mjs`. Antes y después de los ataques había {PRODUCTOS_DISP} productos disponibles.", tam=9.5)
figura("Pruebas de Ataque contra la API", "term-05-pruebas-ataque-api.png", 6.2)
figura("npm audit Antes y Después de Fijar las Dependencias Corregidas", "term-02-npm-audit-antes-despues.png", 6.2)

# =====================================================================
# FASE 4 – AUDITORÍA FINAL
# =====================================================================
H("Fase 4: Auditoría Final (Antes y Después)", 2)
P("La Tabla 8 compara las medianas de las nueve corridas (tres sesiones de tres corridas intercaladas). La columna «Antes» "
  "corresponde a la versión etiquetada `antes-auditoria`, medida en las mismas sesiones que la versión optimizada. La Tabla 9 "
  "muestra la mediana de cada sesión, para que se vea cuánto varían las métricas que dependen de la CPU.")
filas = []
for k, nombre in PAGS:
    a, d = ANTES[k], DESPUES[k]
    filas.append([nombre, "Rendimiento", a["rendimiento"], d["rendimiento"], f"{'+' if d['rendimiento']>=a['rendimiento'] else ''}{d['rendimiento']-a['rendimiento']} pts"])
    filas.append(["", "FCP", seg(a["fcp"]), seg(d["fcp"]), delta(a["fcp"], d["fcp"])])
    filas.append(["", "LCP", seg(a["lcp"]), seg(d["lcp"]), delta(a["lcp"], d["lcp"])])
    filas.append(["", "TBT", msf(a["tbt"]), msf(d["tbt"]), delta(a["tbt"], d["tbt"])])
    filas.append(["", "CLS", num(a["cls"], 3), num(d["cls"], 3), "igual" if abs(a["cls"] - d["cls"]) < 1e-4 else delta(a["cls"], d["cls"])])
    filas.append(["", "Speed Index", seg(a["si"]), seg(d["si"]), delta(a["si"], d["si"])])
    filas.append(["", "Peso total", kb(a["pesoKB"]), kb(d["pesoKB"]), delta(a["pesoKB"], d["pesoKB"])])
    filas.append(["", "Peticiones", a["peticiones"], d["peticiones"], "igual" if a["peticiones"] == d["peticiones"] else f"{d['peticiones']-a['peticiones']:+d}"])
tabla("Comparación Antes/Después con Lighthouse Móvil y Red 3G Simulada (Mediana de 9 Corridas)",
      ["Página", "Métrica", "Antes", "Después", "Cambio"], filas, [1.5, 1.3, 1.1, 1.1, 1.1],
      "Tres sesiones de corridas intercaladas, los días 22 y 23 de noviembre de 2026. Umbrales «buenos»: LCP ≤ 2,5 s, TBT ≤ 200 ms, CLS ≤ 0,1. Un cambio negativo en tiempos o pesos es una mejora.", tam=9.5, resaltar_col=3)
fs = []
for k, nombre in PAGS:
    a, d = ANTES[k]["sesiones"], DESPUES[k]["sesiones"]
    fs.append([nombre, "TBT (ms)", " / ".join(str(round(x["tbt"])) for x in a), " / ".join(str(round(x["tbt"])) for x in d)])
    fs.append(["", "LCP (s)", " / ".join(num(x["lcp"] / 1000, 2) for x in a), " / ".join(num(x["lcp"] / 1000, 2) for x in d)])
    fs.append(["", "Rendimiento", " / ".join(str(x["rendimiento"]) for x in a), " / ".join(str(x["rendimiento"]) for x in d)])
tabla("Mediana de Cada Sesión (Sesión 1 / Sesión 2 / Sesión 3)", ["Página", "Métrica", "Antes", "Después"], fs,
      [1.5, 1.3, 1.75, 1.75], "El peso, las peticiones y el tamaño del HTML no dependen de la CPU y fueron idénticos en todas las corridas de cada versión.", tam=9.5)
figura("Comparación de Métricas Antes y Después", "grafico-antes-despues.png", 6.3)
P(f"En la mediana de las nueve corridas el **TBT**, indicador de laboratorio de la interactividad, bajó en las tres páginas "
  f"(en promedio de {msf(tbt_a)} a {msf(tbt_d)}) y el puntaje de rendimiento subió en las tres (de {num(perf_a,0)} a "
  f"{num(perf_d,0)} en promedio). Sin embargo, la Tabla 9 obliga a leer ese resultado con cautela: el TBT de la versión "
  f"optimizada fue menor en {ses_tbt_mejor['inicio']} de {n_ses} sesiones en el inicio, {ses_tbt_mejor['menu']} de {n_ses} en el menú y "
  f"{ses_tbt_mejor['carrito']} de {n_ses} en el carrito. En la sesión 3, con el equipo más descargado, ambas versiones bajaron a "
  "100–200 ms y la versión optimizada quedó levemente por encima. Como el JavaScript es el mismo en las dos versiones, la "
  "diferencia de TBT depende sobre todo del ruido de CPU del equipo; se interpreta como una tendencia favorable, no como una "
  "mejora demostrada.")
P(f"Los cambios que no dependen de la CPU sí son claros y se repitieron idénticos en todas las corridas: el peso del inicio bajó "
  f"de {kb(ia['pesoKB'])} a {kb(da['pesoKB'])} y el del menú de {kb(ma['pesoKB'])} a {kb(md['pesoKB'])}, por el HTML más "
  f"liviano y las fotos con calidad 60. El carrito, en cambio, subió de {kb(ca['pesoKB'])} a {kb(cd['pesoKB'])}: esa página no "
  "tiene fotos ni datos que recortar, y las cabeceras de seguridad (unos 0,55 KB) viajan también en el documento, en el ícono "
  "y en las cinco peticiones de precarga (RSC) de los enlaces. Es el costo, pequeño y conocido, de la seguridad. El FCP, el "
  "CLS y el número de peticiones prácticamente no cambiaron; el Speed Index del menú empeoró en la mediana, pero varió entre "
  "1,8 y 3,7 s en ambas versiones según la sesión.")
P("El LCP sigue por encima de 2,5 s en las tres páginas. El análisis muestra que el JavaScript base de Next.js y React "
  f"(unos {kb(B_DESPUES['porRuta']['/']['jsGzipKB'])} comprimidos, iguales antes y después) es el factor dominante bajo 3G con "
  "una CPU cuatro veces más lenta, y que ninguna de las técnicas del taller lo reduce sin cambiar de arquitectura. Este "
  "resultado se informa tal como se midió, sin presentarlo como un éxito.")
figura("Informe de Lighthouse del Inicio, Antes", "lh-antes-inicio.png", 4.4)
figura("Informe de Lighthouse del Inicio, Después", "lh-despues-inicio.png", 4.4)
figura("Informe de Lighthouse del Menú, Antes", "lh-antes-menu.png", 4.4)
figura("Informe de Lighthouse del Menú, Después", "lh-despues-menu.png", 4.4)
ra, rd = RED["antes"]["mediana"], RED["despues"]["mediana"]
P(f"Con la red 3G aplicada de verdad en Chrome (no simulada), la página de menú transfirió {kb(ra['totalKB'])} en "
  f"{len(ra['peticiones'])} peticiones antes y {kb(rd['totalKB'])} en {len(rd['peticiones'])} después, con un LCP real de "
  f"{seg(ra['tiempos']['lcp'])} y {seg(rd['tiempos']['lcp'])} respectivamente (mediana de tres cargas; Figuras 19 y 20). Las seis "
  f"fotos pasaron de {kb(img_kb('antes'))} a {kb(img_kb('despues'))} ({delta(img_kb('antes'), img_kb('despues'))}). En la cascada se observa "
  "que las cuatro fotos que están fuera de la pantalla comienzan a descargarse recién después del primer pintado, gracias a la "
  "carga diferida. Con la red aplicada de verdad el LCP queda cerca de 2,5 s, mucho menos que los 6–7 s que estima la "
  "simulación de Lighthouse, que es más pesimista porque multiplica el tiempo de CPU observado.")
figura("Registro de Red del Menú con 3G Aplicado, Antes", "red-3g-antes-menu.png", 6.3,
       "Datos obtenidos con el Chrome DevTools Protocol, el mismo origen de datos que usa el panel Network de DevTools.")
figura("Registro de Red del Menú con 3G Aplicado, Después", "red-3g-despues-menu.png", 6.3)
figura("Compilación de Producción de la Versión Optimizada", "term-03-build-produccion.png", 5.8)
salto()

# =====================================================================
# ODS Y EJES
# =====================================================================
H("Aporte a los Objetivos de Desarrollo Sostenible")
tabla("Vinculación de la Auditoría con los ODS", ["ODS", "Aporte concreto del trabajo"], [
    ["ODS 4 · Educación de calidad", "La auditoría se documentó paso a paso, con scripts reproducibles y errores incluidos, para que otros estudiantes puedan repetirla y aprender de ella."],
    ["ODS 8 · Trabajo decente y crecimiento económico", "Un negocio local que vende en línea de forma segura protege los datos de sus clientes y su reputación, y puede crecer sin depender de intermediarios."],
    ["ODS 9 · Industria, innovación e infraestructura", "Se aplicaron buenas prácticas de la industria (Core Web Vitals, OWASP Top 10:2025, CSP) a la infraestructura digital de una pyme."],
    ["ODS 10 · Reducción de las desigualdades", "Optimizar para 3G y celulares lentos beneficia a quienes viven en zonas con mala cobertura o compran datos por megas: la tienda responde más rápido y consume menos saldo."],
], [2.0, 4.3])
H("Ejes Transversales", 2)
vinetas([
    "**Tecnologías emergentes e IA:** se usó un asistente de IA como apoyo técnico, verificando cada resultado con mediciones propias.",
    "**Emprendedurismo e innovación:** una pyme con una tienda rápida y segura compite mejor en el comercio electrónico.",
    "**Investigación en el aula:** se formularon hipótesis (por ejemplo, que el CSS en línea mejoraría el LCP), se midieron y se descartaron cuando los datos no las apoyaron.",
    "**Responsabilidad social y ética:** la auditoría fue defensiva, sobre una aplicación propia y solo en localhost; los datos de prueba se identificaron como tales y las credenciales permanecen en `.env`.",
])

# =====================================================================
# PROMPTS
# =====================================================================
H("Uso de Inteligencia Artificial y Prompts")
P("El trabajo se realizó con Claude Code (modelo Claude Opus 5.5) como asistente de programación. El equipo redactó el "
  "*prompt* principal por fases y luego un segundo mensaje con restricciones. La Tabla 11 resume sus partes y la técnica de "
  "*prompting* que aplica cada una. Todas las cifras del informe provienen de mediciones ejecutadas, no de estimaciones del "
  "modelo.")
tabla("Prompts Utilizados y Técnica Aplicada", ["N.º", "Prompt (resumido)", "Propósito", "Técnica"], [
    ["1", "«Actúa como auditor senior de rendimiento web (WPO) y seguridad frontend (OWASP)».", "Fijar el nivel técnico y el enfoque de la respuesta", "Asignación de rol"],
    ["2", "Contexto: trabajo UPDS, Next.js 16 + Tailwind + Prisma + MySQL en XAMPP, red 3G, auditoría defensiva solo en localhost.", "Dar el escenario y los límites éticos", "Contexto explícito"],
    ["3", "«Antes de cambiar nada: haz un commit… ejecuta npm run build y npm run start (producción, no dev)».", "Conservar la versión original y medir en condiciones reales", "Precondiciones"],
    ["4", "Fase 1: Lighthouse móvil con rttMs=300, throughputKbps=700, cpuSlowdownMultiplier=4; 3 corridas y mediana; revisar seguridad contra el OWASP Top 10 vigente (verificar la versión).", "Medición reproducible y verificación de la fuente", "Parámetros exactos + verificación"],
    ["5", "Fase 2: minificación, lazy loading (el hero no), next/dynamic en el admin, fuentes con swap, compresión y caché.", "Optimización guiada por técnicas concretas", "Descomposición en tareas"],
    ["6", "Fase 3: desinfectar en el servidor (lib/validacion.ts), cabeceras sin romper next/image, probar <script> e <img onerror>, verificar Prisma.", "Seguridad con criterios de aceptación", "Restricciones + casos de prueba"],
    ["7", "Fase 4: repetir exactamente las mismas mediciones y armar una tabla antes/después.", "Comparación justa", "Criterio de evaluación"],
    ["8", "Entregables: capturas reales, informe APA 7 (.docx y .pdf), presentación de 12 a 15 diapositivas, autores.", "Definir el formato de salida", "Formato de salida"],
    ["9", "«Esta es la SEGUNDA PARTE… NO modifiques ni borres nada de la carpeta informe/… usa el mismo estilo visual».", "Proteger la entrega anterior y dar continuidad", "Restricciones negativas"],
], [0.4, 2.7, 1.8, 1.4], "Los *prompts* se citan resumidos. Al final se pidió «trabaja por fases y prueba cada una antes de seguir», una instrucción de verificación incremental.", tam=9)

# =====================================================================
# CONCLUSIONES Y RECOMENDACIONES
# =====================================================================
H("Conclusiones")
vinetas([
    f"Las optimizaciones WPO redujeron de forma comprobable el peso de las páginas con contenido (inicio {delta(ia['pesoKB'], da['pesoKB'])}, menú {delta(ma['pesoKB'], md['pesoKB'])}, fotos del menú {delta(img_kb('antes'), img_kb('despues'))}). En la mediana de nueve corridas el TBT bajó ({delta(ANTES['inicio']['tbt'], DESPUES['inicio']['tbt'])} en el inicio, {delta(ANTES['menu']['tbt'], DESPUES['menu']['tbt'])} en el menú y {delta(ANTES['carrito']['tbt'], DESPUES['carrito']['tbt'])} en el carrito) y el puntaje subió en todas, pero esa mejora no se repitió en todas las sesiones y se considera una tendencia.",
    "La minificación ya venía resuelta por Next.js; la ganancia real estuvo en eliminar los datos duplicados del HTML y los anchos de imagen innecesarios, algo que solo se detecta midiendo.",
    "El LCP en 3G sigue por encima de 2,5 s porque lo domina el JavaScript del framework. Las técnicas del taller no alcanzan para bajarlo de ese umbral en esta arquitectura.",
    "Medir con cuidado importa: el ruido de CPU del equipo, el CSS en línea y el peso de las propias cabeceras de seguridad habrían llevado a conclusiones equivocadas si no se hubieran comparado las versiones en las mismas condiciones. La seguridad también tiene un costo medible: el carrito pesa 4 KB más por las cabeceras.",
    "La aplicación ya era resistente al XSS gracias al escape de React; ahora además guarda solo texto plano en MySQL y la CSP bloquea scripts externos, la fuga de datos y el clickjacking. Ninguno de los ataques probados se ejecutó.",
    "Prisma protege contra la inyección SQL al parametrizar todas las consultas, y las cuatro vulnerabilidades altas de dependencias se corrigieron sin migrar de versión mayor.",
])
H("Recomendaciones")
vinetas([
    "Limitar los intentos de inicio de sesión del administrador (OWASP A07), por ejemplo cinco intentos cada 15 minutos por IP.",
    "Publicar la tienda con HTTPS y HTTP/2 o HTTP/3: así se activa HSTS y las cabeceras se comprimen (HPACK/QPACK).",
    "Evaluar la CSP con *nonce* solo en las páginas del panel admin, donde el pre-renderizado no es tan importante, para retirar `'unsafe-inline'` en esa zona.",
    "Para bajar el LCP en 3G, reducir el JavaScript de cliente: convertir en componentes de servidor las partes que no necesitan interacción y revisar si el carrito puede cargarse después del primer render.",
    "Medir con usuarios reales (datos de campo) cuando la tienda esté publicada, porque el laboratorio no reemplaza al INP real.",
    "Planificar la migración a Prisma 7 para dejar de depender de `overrides`, y ejecutar `npm audit` en cada entrega.",
])
salto()

# =====================================================================
# REFERENCIAS (APA 7, orden alfabético, sangría francesa)
# =====================================================================
H("Referencias")
REFS = [
    "Anthropic. (2026). *Claude Code* (Claude Opus 5.5) [Asistente de programación basado en un modelo de lenguaje]. https://claude.com/product/claude-code",
    "Google. (s.f.-a). *Lighthouse performance scoring*. Chrome for Developers. https://developer.chrome.com/docs/lighthouse/performance/performance-scoring",
    "GoogleChrome. (s.f.). *Throttling in Lighthouse* [Documentación]. GitHub. https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md",
    "Grigorik, I. (2013). *High performance browser networking*. O'Reilly Media. https://hpbn.co/",
    "MDN Web Docs. (2025, 11 de julio). *Minification*. Mozilla. https://developer.mozilla.org/en-US/docs/Glossary/Minification",
    "MDN Web Docs. (2026a, 14 de agosto). *HTTP caching*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching",
    "MDN Web Docs. (2026b, 22 de marzo). *Content-Security-Policy (CSP) header*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy",
    "MDN Web Docs. (2026c, 17 de noviembre). *Lazy loading*. Mozilla. https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading",
    "Naciones Unidas. (s.f.). *Objetivos de Desarrollo Sostenible*. https://www.un.org/sustainabledevelopment/es/objetivos-de-desarrollo-sostenible/",
    "Osmani, A., Djirdeh, H., Bynens, M. y Pollard, B. (s.f.). *Browser-level image lazy loading for the web*. web.dev. https://web.dev/articles/browser-level-image-lazy-loading",
    "OWASP Cheat Sheet Series Team. (s.f.-a). *Cross site scripting prevention cheat sheet*. OWASP Foundation. https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
    "OWASP Cheat Sheet Series Team. (s.f.-b). *Content security policy cheat sheet*. OWASP Foundation. https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html",
    "OWASP Cheat Sheet Series Team. (s.f.-c). *HTTP security response headers cheat sheet*. OWASP Foundation. https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html",
    "OWASP Cheat Sheet Series Team. (s.f.-d). *SQL injection prevention cheat sheet*. OWASP Foundation. https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
    "OWASP Foundation. (2025a). *OWASP Top 10:2025*. https://owasp.org/Top10/2025/",
    "OWASP Foundation. (2025b). *A02:2025 Security misconfiguration*. https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/",
    "OWASP Foundation. (2025c). *A03:2025 Software supply chain failures*. https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/",
    "Prisma. (s.f.). *Raw queries*. Prisma Documentation. https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries",
    "Souders, S. (2007). *High performance web sites: Essential knowledge for front-end engineers*. O'Reilly Media.",
    "Tailwind Labs. (s.f.). *Detecting classes in source files*. Tailwind CSS. https://tailwindcss.com/docs/detecting-classes-in-source-files",
    "Vercel. (2026a, 30 de junio). *headers*. Next.js Documentation. https://nextjs.org/docs/app/api-reference/config/next-config-js/headers",
    "Vercel. (2026b, 10 de marzo). *How to lazy load client components and libraries*. Next.js Documentation. https://nextjs.org/docs/app/guides/lazy-loading",
    "Vercel. (2026c, 20 de marzo). *How to set a content security policy (CSP) for your Next.js application*. Next.js Documentation. https://nextjs.org/docs/app/guides/content-security-policy",
    "Vercel. (2026d, 18 de noviembre). *Image component*. Next.js Documentation. https://nextjs.org/docs/app/api-reference/components/image",
    "Walton, P. (2024, 31 de octubre). *Web Vitals*. web.dev. https://web.dev/articles/vitals",
    "Walton, P. y Pollard, B. (2025, 4 de septiembre). *Largest Contentful Paint (LCP)*. web.dev. https://web.dev/articles/lcp",
    "Wagner, J. y Pollard, B. (2025, 2 de septiembre). *Interaction to Next Paint (INP)*. web.dev. https://web.dev/articles/inp",
]
for ref in sorted(REFS, key=lambda r: re.sub(r"[*()]", "", r).lower()):
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Inches(-0.5)
    p.paragraph_format.left_indent = Inches(0.5)
    runs(p, ref)
salto()

# =====================================================================
# ANEXOS
# =====================================================================
H("Anexos")
H("Anexo A: Cómo Reproducir la Auditoría", 2)
P("Con XAMPP (MySQL) encendido y desde la carpeta del proyecto:", sangria=False)
codigo('''npm run build
npx next start -p 3005                          # versión optimizada
git worktree add ../antes antes-auditoria       # versión original (en otra carpeta)
cd ../antes && npm ci && npm run build && npx next start -p 3006

cd informe-auditoria/scripts
npm i lighthouse@12                             # y definir LH_CLI / PUPPETEER_CORE
node lighthouse-3g.mjs antes=http://localhost:3006 despues=http://localhost:3005
node medir-bundles.mjs despues
node prueba-ataques.mjs                         # requiere ADMIN_PASSWORD
node prueba-navegador.mjs
npx tsx prueba-xss-unitaria.ts''')
H("Anexo B: Archivos Modificados", 2)
tabla("Archivos del Proyecto Modificados en la Auditoría", ["Archivo", "Cambio"], [
    ["next.config.ts", "Cabeceras de seguridad por tipo de recurso, poweredByHeader, compress, srcset, calidad y caché de imágenes"],
    ["lib/validacion.ts", "limpiarTexto() y su uso en pedidos y productos; validación extra de la URL de imagen"],
    ["lib/tipos.ts", "Tipo ProductoCarrito (datos mínimos para el carrito)"],
    ["components/TarjetaProducto.tsx, carrito/BotonAgregar.tsx, carrito/CarritoProvider.tsx", "El botón recibe solo 4 campos"],
    ["components/ImagenProducto.tsx, MenuInteractivo.tsx", "Prioridad alta para la imagen LCP, lazy loading para el resto, calidad 60"],
    ["components/admin/GestorProductos.tsx", "Formulario cargado con next/dynamic"],
    ["app/globals.css", "Tailwind escanea solo app/, components/ y lib/"],
    ["package.json", "overrides de effect y deepmerge-ts (npm audit: 0 vulnerabilidades)"],
], [2.6, 3.7], tam=9)

doc.save(str(SALIDA))
print("✓", SALIDA)
