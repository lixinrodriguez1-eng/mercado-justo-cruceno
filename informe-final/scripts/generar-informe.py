# -*- coding: utf-8 -*-
"""
Genera el informe técnico IMRyD (APA 7, Word) del Proyecto Socioformativo Integrador:
Mercado Justo Cruceño. Uso:  python generar-informe.py
- Toma los estilos (Times New Roman 12, doble espacio, encabezado con número de
  página) del informe de la primera entrega, que solo se LEE: no se modifica.
- Las cifras de pruebas y Lighthouse salen de informe-final/resultados/*.json.
- Las estadísticas de contexto llevan su fuente (OIT, INE, CEPAL, Banco Mundial, ATT, BCB).
"""
import json
import re
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt

RAIZ = Path(__file__).resolve().parents[2]
FIN = RAIZ / "informe-final"
RES = FIN / "resultados"
CAP = FIN / "capturas"
DIA = FIN / "diagramas"
REC = FIN / "recursos"
PLANTILLA = RAIZ / "informe" / "Informe_Cafe_Chiquitano_APA7.docx"
SALIDA = FIN / "Informe_Final_Mercado_Justo_Crucenio_APA7.docx"
URL = "https://mercado-justo-cruceno.vercel.app"
REPO = "https://github.com/lixinrodriguez1-eng/mercado-justo-cruceno"

leer = lambda p: json.loads((RES / p).read_text(encoding="utf-8"))
PRUEBAS = leer("prueba-funcional-nube.json")
LH_STD = leer("lighthouse/nube-estandar/resumen.json")
LH_3G = leer("lighthouse/nube-3g/resumen.json")
PAGS = [("inicio", "Inicio (/)"), ("catalogo", "Catálogo (/catalogo)"),
        ("emprendedor", "Emprendedor (/emprendedores/cafe-chiquitano)"), ("registro", "Registro (/registro)")]

def _entorno():
    r = json.loads(next((RES / "lighthouse" / "nube-estandar").glob("*.report.json")).read_text(encoding="utf-8"))
    m = re.search(r"Chrome/(\d+)", r["environment"]["hostUserAgent"])
    return r["lighthouseVersion"], m.group(1) if m else ""
LH_VER, CHROME_VER = _entorno()

def num(x, d=2):
    return f"{x:,.{d}f}".replace(",", "X").replace(".", ",").replace("X", ".")
seg = lambda ms: num(ms / 1000, 2) + " s"
msf = lambda ms: f"{round(ms)} ms"
prom = lambda R, k: sum(R[p][k] for p, _ in PAGS) / len(PAGS)
minimo = lambda R, k: min(R[p][k] for p, _ in PAGS)
N_PRUEBAS, N_PASAN = PRUEBAS["total"], PRUEBAS["pasan"]
N_FUNC = sum(1 for c in PRUEBAS["resultados"] if c["id"].startswith("F"))
N_SEG = sum(1 for c in PRUEBAS["resultados"] if c["id"].startswith("S"))

# =====================================================================
doc = Document(str(PLANTILLA))
cuerpo = doc.element.body
for hijo in list(cuerpo):
    if hijo.tag != qn("w:sectPr"):
        cuerpo.remove(hijo)
doc.core_properties.title = "Plataforma Web Dinámica de Comercio Justo para la Inclusión Digital de Microempresarios Periurbanos en Santa Cruz"
doc.core_properties.author = "Jacqueline Ester Cáceres Subía; Lizeth Adela Rodríguez Padilla"
doc.core_properties.subject = "Proyecto Socioformativo Integrador – Diseño Web II – UPDS"
doc.core_properties.keywords = "comercio justo; inclusión digital; Next.js; MySQL; WPO; OWASP"

# ---------- ayudantes (mismo formato que los informes anteriores) ----------
def runs(parrafo, texto):
    """Admite **negrita**, *cursiva* y `código` (en Consolas) dentro del texto."""
    for parte in re.split(r"(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)", texto):
        if not parte:
            continue
        if parte.startswith("`") and parte.endswith("`") and len(parte) > 1:
            r = parrafo.add_run(parte[1:-1]); r.font.name = "Consolas"
            r._element.rPr.rFonts.set(qn("w:eastAsia"), "Consolas"); r.font.size = Pt(10.5)
        elif parte.startswith("**"):
            parrafo.add_run(parte[2:-2]).bold = True
        elif parte.startswith("*"):
            parrafo.add_run(parte[1:-1]).italic = True
        else:
            parrafo.add_run(parte)
    return parrafo

def P(texto="", sangria=True, centrado=False):
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Inches(0.5) if sangria else Inches(0)
    if centrado:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    return runs(p, texto)

def H(texto, nivel=1):
    return doc.add_paragraph(texto, style=f"Heading {nivel}")

def salto():
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

ESTILOS = [s.name for s in doc.styles]
def vinetas(items):
    for it in items:
        if "List Bullet" in ESTILOS:
            p = doc.add_paragraph(style="List Bullet")
        else:
            p = doc.add_paragraph(); p.paragraph_format.left_indent = Inches(0.5); p.add_run("• ")
        p.paragraph_format.first_line_indent = Inches(0)
        runs(p, it)

def borde(celda, lados, tam=8):
    tcPr = celda._tc.get_or_add_tcPr()
    bordes = tcPr.find(qn("w:tcBorders"))
    if bordes is None:
        bordes = OxmlElement("w:tcBorders"); tcPr.append(bordes)
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
    p.add_run(f"{tipo} {n}").bold = True; p.paragraph_format.keep_with_next = True
    t = doc.add_paragraph(); t.paragraph_format.first_line_indent = Inches(0)
    t.add_run(titulo).italic = True; t.paragraph_format.keep_with_next = True

def nota(texto):
    p = doc.add_paragraph(); p.paragraph_format.first_line_indent = Inches(0)
    p.add_run("Nota.").italic = True
    runs(p, " " + texto)

CONT = {"Tabla": 0, "Figura": 0}
def tabla(titulo, encabezados, filas, anchos, nota_txt=None, tam=10, resaltar_col=None):
    CONT["Tabla"] += 1
    leyenda("Tabla", CONT["Tabla"], titulo)
    t = doc.add_table(rows=1 + len(filas), cols=len(encabezados))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER; t.autofit = False
    for i, fila in enumerate([encabezados] + filas):
        for j, valor in enumerate(fila):
            c = t.cell(i, j); c.width = Inches(anchos[j])
            p = c.paragraphs[0]
            p.paragraph_format.first_line_indent = Inches(0); p.paragraph_format.line_spacing = 1.0
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
    return CONT["Tabla"]

def figura(titulo, ruta, ancho=6.0, nota_txt=None):
    CONT["Figura"] += 1
    leyenda("Figura", CONT["Figura"], titulo)
    p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Inches(0); p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.keep_with_next = bool(nota_txt)
    p.add_run().add_picture(str(ruta), width=Inches(ancho))
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
    p = doc.add_paragraph(); r = p.add_run()
    for tipo, txt in (("begin", None), (None, 'TOC \\o "1-2" \\h \\z \\u'), ("separate", None),
                      (None, "Actualice el índice (clic derecho → Actualizar campo)."), ("end", None)):
        if tipo:
            f = OxmlElement("w:fldChar"); f.set(qn("w:fldCharType"), tipo); r._r.append(f)
        elif txt.startswith("TOC"):
            it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = txt; r._r.append(it)
        else:
            t = OxmlElement("w:t"); t.text = txt; r._r.append(t)

# =====================================================================
# CARÁTULA
# =====================================================================
P("", sangria=False)
p = P("", sangria=False, centrado=True)
p.add_run("Proyecto Socioformativo Integrador").bold = True
p = P("", sangria=False, centrado=True)
p.add_run("Plataforma Web Dinámica de Comercio Justo para la Inclusión Digital de Microempresarios Periurbanos en "
          "Santa Cruz: Mercado Justo Cruceño").bold = True
p = P("", sangria=False, centrado=True); p.paragraph_format.line_spacing = 1.0
p.add_run().add_picture(str(REC / "icono-tienda.png"), width=Inches(1.3))
for linea in ["Jacqueline Ester Cáceres Subía", "Lizeth Adela Rodríguez Padilla",
              "Ingeniería de Sistemas, Universidad Privada Domingo Savio (UPDS)",
              "Diseño Web II", "Ing. Álvaro Moscoso Zeballos", "26 de noviembre de 2026"]:
    P(linea, sangria=False, centrado=True)
salto()

# =====================================================================
# RESUMEN Y ABSTRACT
# =====================================================================
std_min = minimo(LH_STD, "rendimiento")
H("Resumen")
P("En Bolivia la informalidad laboral supera el 80 % de los ocupados (Organización Internacional del Trabajo [OIT], 2025) "
  "y en los barrios periurbanos de Santa Cruz de la Sierra muchos microemprendimientos venden solo en su entorno inmediato, "
  "por estados de WhatsApp, en ferias o a intermediarios que fijan el precio. Este proyecto socioformativo desarrolló y "
  "desplegó *Mercado Justo Cruceño*, una plataforma web multivendedor de comercio justo en la que cada microempresario "
  "publica su historia y sus productos, recibe pedidos ordenados en su propio panel y cobra directamente, con una comisión "
  "de la plataforma del 0 % visible en cada producto. Se siguió una metodología ágil por etapas que evolucionó la tienda "
  "*Café Chiquitano*, ya auditada en rendimiento (WPO) y seguridad (OWASP), hacia un sistema con roles de administrador y "
  "emprendedor, contraseñas con bcrypt, registro con desinfección contra XSS y un modelo relacional en tercera forma normal. "
  f"La aplicación se construyó con Next.js 16, Tailwind CSS 4 y Prisma 6, y se publicó en Vercel con una base MySQL en TiDB "
  f"Cloud Starter ({URL}). Sobre la URL pública, {N_PASAN} de {N_PRUEBAS} pruebas automatizadas funcionales y de seguridad "
  f"(compra multivendedor, aislamiento entre emprendedores, CSRF, XSS, inyección SQL y fuerza bruta) resultaron exitosas, y "
  f"Lighthouse móvil obtuvo entre {std_min} y {max(LH_STD[p]['rendimiento'] for p, _ in PAGS)} puntos de rendimiento en las "
  "cuatro páginas principales. Se concluye que una plataforma ligera, segura y sin comisiones es técnicamente viable con "
  "servicios gratuitos y aborda la falta de canal digital propio; su impacto económico real deberá medirse en un piloto con "
  "emprendedores reales.", sangria=False)
P("*Palabras clave:* comercio justo, inclusión digital, microemprendimiento, Next.js, MySQL, OWASP, rendimiento web.")
P("")
H("Abstract")
P("In Bolivia, informal employment exceeds 80% of workers (International Labour Organization [ILO], 2025), and in the "
  "peri-urban neighborhoods of Santa Cruz de la Sierra many micro-businesses sell only locally, through WhatsApp statuses, "
  "street fairs or intermediaries who set the price. This socio-formative project built and deployed *Mercado Justo "
  "Cruceño*, a multi-vendor fair-trade web platform where each micro-entrepreneur publishes their story and products, "
  "receives orders in a private dashboard and is paid directly, with a 0% platform commission shown on every product. An "
  "agile, stage-based methodology evolved the *Café Chiquitano* store, previously audited for web performance (WPO) and "
  "security (OWASP), into a system with administrator and entrepreneur roles, bcrypt-hashed passwords, XSS-sanitized "
  "registration and a relational model in third normal form. The application uses Next.js 16, Tailwind CSS 4 and Prisma 6, "
  f"and was deployed on Vercel with a MySQL-compatible TiDB Cloud Starter database. On the public URL, {N_PASAN} of "
  f"{N_PRUEBAS} automated functional and security tests passed, and mobile Lighthouse scored between {std_min} and "
  f"{max(LH_STD[p]['rendimiento'] for p, _ in PAGS)} performance points on the four main pages. A lightweight, secure, "
  "commission-free platform is technically feasible with free-tier services; its economic impact must be measured in a "
  "pilot with real entrepreneurs.", sangria=False)
P("*Keywords:* fair trade, digital inclusion, micro-entrepreneurship, Next.js, MySQL, OWASP, web performance.")
salto()
indice()
salto()

# =====================================================================
# INTRODUCCIÓN
# =====================================================================
H("Introducción")
H("Problema Contextual", 2)
P("Santa Cruz es el departamento más poblado de Bolivia y el que más creció entre censos (Instituto Nacional de "
  "Estadística [INE], 2024); según los resultados del Censo 2024, el 82,8 % de su población vive en áreas urbanas (INE, "
  "2025). Buena parte de ese crecimiento se concentra en barrios periurbanos como Plan 3000, Villa 1ro de Mayo, Pampa de la "
  "Isla o Los Lotes, donde abundan pequeños negocios familiares de alimentos, artesanía, costura y cosmética casera.")
P("Ese tejido productivo es mayoritariamente informal. La OIT (2025) ubica la tasa de empleo informal de Bolivia en 82,3 % "
  "en el primer semestre de 2025, la más alta de América Latina y el Caribe, frente a un promedio regional de 46,7 %. A "
  "escala regional, la Comisión Económica para América Latina y el Caribe (CEPAL, s.f.) señala que las micro, pequeñas y "
  "medianas empresas son alrededor del 99 % de las empresas y emplean a cerca del 67 % de los trabajadores, pero con una "
  "productividad muy inferior a la de las grandes empresas.")
P("El problema que aborda este proyecto tiene tres partes. Primero, **la falta de un canal digital propio**: el "
  "microemprendedor periurbano vende a quien pasa por su puerta, a sus contactos de WhatsApp o en ferias de fin de semana. "
  "Segundo, **la dependencia de intermediarios** (rescatistas, revendedores y distribuidoras) que fijan el precio y se quedan "
  "con parte del valor; no se encontró una fuente oficial que cuantifique ese margen en Santa Cruz, por lo que en este "
  "informe se describe de forma cualitativa. Tercero, **la informalidad y la desconfianza**: el comprador no sabe quién "
  "produce ni cuánto recibe esa persona, y el productor no tiene un registro ordenado de sus pedidos.")
P("Al mismo tiempo existen condiciones que hacen viable una solución digital: el 79,7 % de la población boliviana usó "
  "internet en 2024 (Banco Mundial, s.f.), a diciembre de ese año había 11,25 millones de líneas móviles con acceso a "
  "internet (Autoridad de Regulación y Fiscalización de Telecomunicaciones y Transportes [ATT], 2025) y los pagos por "
  "código QR crecieron 131 % en 2025 respecto de 2024 (Banco Central de Bolivia [BCB], 2026). Es decir, el comprador y el "
  "productor ya tienen celular, internet y una forma de pago digital; lo que falta es un punto de encuentro justo.")
H("Justificación", 2)
P("Las alternativas al alcance de un microemprendedor no resuelven las tres partes del problema: las redes sociales son "
  "gratuitas pero no ordenan pedidos ni muestran el origen del producto; las aplicaciones de reparto y los mercados en "
  "línea cobran comisiones y priorizan a negocios formales; una tienda propia exige conocimientos y costos que no tiene. "
  "Una plataforma colectiva de comercio justo, diseñada para celulares de gama baja y conexiones lentas, sin comisión y "
  "con contacto directo productor–cliente, reduce esa brecha. Desde lo académico, el proyecto integra lo aprendido en "
  "Diseño Web II (framework ágil, SGBD, WPO, OWASP y despliegue) en un producto publicado que responde a un problema real "
  "de la ciudad, en línea con los Objetivos de Desarrollo Sostenible 4, 8, 9 y 10 (Naciones Unidas, s.f.).")
H("Pregunta de Investigación", 2)
P("¿Es posible, con tecnologías web modernas y servicios en la nube gratuitos, construir y desplegar una plataforma de "
  "comercio justo segura y rápida en redes móviles que permita a microempresarios periurbanos de Santa Cruz vender "
  "directamente a clientes de toda la ciudad, sin intermediarios y con transparencia sobre lo que recibe el productor?")
H("Objetivos", 2)
P("**Objetivo general.** Desarrollar y desplegar en internet una plataforma web dinámica de comercio justo, multivendedor, "
  "segura y optimizada para móviles, que facilite la inclusión digital de microempresarios de los barrios periurbanos de "
  "Santa Cruz de la Sierra.", sangria=False)
P("**Objetivos específicos.**", sangria=False)
vinetas([
    "Analizar el problema contextual de los microempresarios periurbanos con datos oficiales (OIT, INE, CEPAL, Banco Mundial, ATT y BCB).",
    "Diseñar un modelo de datos relacional normalizado y una arquitectura con roles de administrador y emprendedor.",
    "Implementar el registro de emprendedores, sus páginas públicas, el catálogo filtrable por rubro, barrio y emprendedor, y la compra multivendedor con comercio justo visible (comisión, WhatsApp y QR referencial).",
    "Conservar las optimizaciones WPO y los controles OWASP de la versión auditada y ampliarlos al nuevo alcance (control de acceso, CSRF, fuerza bruta).",
    "Desplegar la aplicación en Vercel con una base MySQL en la nube y verificar sobre la URL pública su funcionamiento, su seguridad y su rendimiento con Lighthouse.",
])
H("Marco Teórico", 2)
P("**Comercio justo.** La Organización Mundial del Comercio Justo (WFTO, s.f.) lo define mediante diez principios, entre "
  "ellos crear oportunidades para productores en desventaja económica, transparencia y rendición de cuentas, prácticas "
  "comerciales justas, pago de un precio justo y no discriminación. La plataforma traduce varios de ellos a funciones: el "
  "productor fija su precio, la comisión se muestra en cada producto y el cliente conoce quién produce y dónde.")
P("**Inclusión digital.** Van Dijk (2020) explica que la brecha digital no es solo de acceso a dispositivos, sino también "
  "de habilidades y de aprovechamiento: tener internet no basta si no se cuenta con herramientas adecuadas para participar "
  "en la economía digital. Por eso el diseño prioriza interfaces simples, uso desde el celular y redes lentas.")
P("**Next.js y React.** Next.js es un *framework* de React que permite renderizar componentes en el servidor, combinar "
  "partes estáticas y dinámicas de una página (*Partial Prerendering* con Cache Components) y exponer rutas API en el mismo "
  "proyecto (Vercel, 2026a). Esto reduce el JavaScript que descarga el celular, porque solo las partes interactivas se "
  "ejecutan en el navegador.")
P("**Sistemas gestores de bases de datos (SGBD).** Un SGBD relacional organiza los datos en tablas vinculadas por claves y "
  "garantiza su integridad con restricciones y transacciones (Elmasri y Navathe, 2016). Se usó MySQL en local (XAMPP) y TiDB "
  "Cloud Starter en la nube, un servicio compatible con el protocolo de MySQL que ofrece un plan gratuito y funciona con "
  "Prisma (PingCAP, s.f.). Prisma es un ORM que genera consultas parametrizadas y gestiona migraciones (Prisma, s.f.).")
P("**Optimización del rendimiento web (WPO).** Google define las *Core Web Vitals* (LCP, INP y CLS) como métricas de "
  "experiencia; en laboratorio, Lighthouse estima además el *Total Blocking Time* y combina las métricas en un puntaje de "
  "0 a 100 (Google, s.f.; Walton, 2024). Para quien navega con datos móviles, cada kilobyte y cada viaje de red cuentan.")
P("**Seguridad (OWASP).** El OWASP Top 10:2025 agrupa los riesgos más críticos de las aplicaciones web; los más relevantes "
  "aquí son el control de acceso roto (A01), la mala configuración (A02), las fallas criptográficas (A04), la inyección, que "
  "incluye XSS y SQL (A05), y las fallas de autenticación (A07) (OWASP Foundation, 2025).")

# =====================================================================
# MÉTODOS
# =====================================================================
H("Métodos")
H("Enfoque y Metodología Ágil por Etapas", 2)
P("Se adoptó un enfoque de investigación aplicada y desarrollo tecnológico con evaluación cuantitativa (pruebas automatizadas "
  "y métricas de Lighthouse). El trabajo se organizó en iteraciones cortas inspiradas en Scrum (Schwaber y Sutherland, 2020): "
  "cada etapa tuvo un objetivo, un entregable funcionando y una verificación antes de pasar a la siguiente. La Tabla 1 resume "
  "las etapas; las fechas provienen del historial de Git del proyecto.")
tabla("Etapas del Desarrollo", ["Etapa", "Objetivo", "Entregable y verificación"], [
    ["1 · 18/11/2026", "Tienda base Café Chiquitano con Next.js, Prisma y MySQL", "Tienda con menú, carrito y panel admin (entrega anterior)"],
    ["2 · 22–24/11/2026", "Auditoría WPO y seguridad OWASP", "Optimizaciones, cabeceras y desinfección XSS medidas antes/después"],
    ["3 · 25/11/2026", "Análisis del problema contextual y requisitos", "Requisitos, casos de uso, modelo ER y fuentes estadísticas"],
    ["4 · 25/11/2026", "Evolución a plataforma multivendedor", f"Roles, registro, catálogo filtrable, comercio justo; {N_PRUEBAS} pruebas en local"],
    ["5 · 26/11/2026", "Despliegue en la nube", "Base en TiDB Cloud, código en GitHub, aplicación en Vercel"],
    ["6 · 26/11/2026", "Verificación y documentación", "Pruebas, capturas y Lighthouse sobre la URL pública; informe y presentación"],
], [1.4, 2.4, 2.5])

H("Requisitos Funcionales y No Funcionales", 2)
tabla("Requisitos Funcionales", ["Código", "Requisito"], [
    ["RF01", "Registrar emprendedores con nombre, emprendimiento, rubro, barrio periurbano, historia, WhatsApp y foto."],
    ["RF02", "Aprobar, quitar la aprobación o suspender emprendedores (rol ADMIN); solo los aprobados aparecen en la tienda."],
    ["RF03", "Iniciar sesión con correo y contraseña y redirigir según el rol."],
    ["RF04", "Gestionar (crear, editar, ocultar, eliminar) solo los productos propios (rol EMPRENDEDOR)."],
    ["RF05", "Mostrar una página pública por emprendedor con su historia y sus productos."],
    ["RF06", "Ofrecer un catálogo general filtrable por rubro, barrio y emprendedor, con buscador."],
    ["RF07", "Mostrar en cada producto cuánto recibe el productor y la comisión de la plataforma."],
    ["RF08", "Contactar al productor por WhatsApp desde el producto, su página y la confirmación."],
    ["RF09", "Comprar con un carrito que mezcle productos de varios emprendedores y repartir la compra en un pedido por emprendedor."],
    ["RF10", "Mostrar un QR de pago referencial por pedido, dirigido al productor."],
    ["RF11", "Permitir que cada emprendedor vea y actualice el estado solo de sus pedidos, y que el admin los supervise todos."],
    ["RF12", "Cargar datos iniciales: 6 emprendedores ficticios de barrios periurbanos y unos 30 productos."],
], [0.8, 5.5], tam=9.5)
tabla("Requisitos No Funcionales", ["Código", "Requisito", "Criterio de aceptación"], [
    ["RNF01", "Rendimiento móvil", "Lighthouse móvil ≥ 90 en las páginas públicas principales"],
    ["RNF02", "Seguridad", "Contraseñas con bcrypt, control de acceso por rol, anti-IDOR, anti-CSRF, desinfección XSS, consultas parametrizadas, bloqueo por fuerza bruta y cabeceras de seguridad"],
    ["RNF03", "Disponibilidad", "Aplicación publicada con HTTPS en una URL pública"],
    ["RNF04", "Usabilidad y accesibilidad", "Diseño responsivo móvil primero, contraste AA, navegación por teclado"],
    ["RNF05", "Integridad de datos", "Modelo en 3FN, transacciones en la compra, precios calculados en el servidor"],
    ["RNF06", "Confidencialidad de secretos", "El .env y las credenciales nunca se suben a GitHub"],
], [0.8, 1.6, 3.9], tam=9.5)

H("Casos de Uso", 2)
P("Se identificaron tres actores: el cliente, que no necesita cuenta; el emprendedor; y el administrador de la plataforma. "
  "La Figura 1 muestra los trece casos de uso. Las validaciones y la verificación de la sesión se incluyen en todos los casos "
  "que modifican datos.")
figura("Diagrama de Casos de Uso", DIA / "casos-de-uso.png", 6.3)

H("Arquitectura", 2)
P("La aplicación sigue una arquitectura en capas dentro de un solo proyecto Next.js (Figura 2). En el borde, `proxy.ts` "
  "decide quién puede entrar a `/admin` y a `/panel` y rechaza las peticiones que modifican datos si no vienen del propio "
  "sitio, y `next.config.ts` agrega las cabeceras de seguridad. Las páginas son componentes de servidor que leen los datos y "
  "solo el carrito, los filtros y los gestores de los paneles se ejecutan en el navegador. Las rutas `/api` validan y "
  "desinfectan cada entrada y llaman a la capa de servicios (`lib/`), que es la única que habla con la base mediante Prisma.")
figura("Arquitectura de la Plataforma", DIA / "arquitectura.png", 6.3)

H("Modelo Entidad-Relación", 2)
P("El modelo tiene ocho tablas en tercera forma normal (Figura 3). Rubros y barrios están en tablas propias para filtrar sin "
  "duplicar texto. Un usuario puede tener como máximo un perfil de emprendedor. Los datos del cliente se guardan una sola "
  "vez en `compras` y cada compra se reparte en `pedidos`, uno por emprendedor, con su subtotal, la comisión y el monto que "
  "recibe el productor. `detalle_pedidos` copia el nombre y el precio del producto al momento de comprar, para que el "
  "historial no cambie si luego se edita el producto. La evolución desde Café Chiquitano se aplicó como una segunda "
  "migración de Prisma, de modo que el historial del esquema queda versionado.")
F_ER = figura("Modelo Entidad-Relación", DIA / "modelo-er.png", 6.3)

H("Stack Tecnológico", 2)
tabla("Tecnologías Utilizadas", ["Capa", "Tecnología", "Uso en el proyecto"], [
    ["Interfaz", "React 19, Next.js 16 (App Router), Tailwind CSS 4", "Páginas, componentes y estilos móvil primero"],
    ["Lógica", "Route Handlers de Next.js, TypeScript", "API REST de catálogo, compras, registro, paneles"],
    ["Datos", "Prisma 6 · MySQL (XAMPP) · TiDB Cloud Starter", "ORM, migraciones y seed; base local y en la nube"],
    ["Seguridad", "bcryptjs, HMAC-SHA256 (Web Crypto), CSP y cabeceras", "Contraseñas, sesiones firmadas, protección del navegador"],
    ["Otros", "qrcode, next/image, next/font", "QR referencial en SVG, imágenes AVIF/WebP, fuentes locales"],
    ["Despliegue", "GitHub, Vercel (plan Hobby)", "Repositorio y hospedaje con HTTPS"],
    ["Pruebas", f"Lighthouse {LH_VER}, Playwright, Node.js", "Rendimiento, recorridos en navegador y pruebas HTTP"],
], [1.0, 2.6, 2.7], tam=9.5)

H("Herramientas y Procedimiento de Prueba", 2)
P(f"Se usaron tres herramientas propias, ubicadas en `informe-final/scripts/`, que pueden ejecutarse contra cualquier URL:")
vinetas([
    f"`prueba-funcional.mjs`: {N_PRUEBAS} casos automatizados por HTTP: {N_FUNC} funcionales (catálogo, filtros, compra multivendedor, roles, registro y aprobación) y {N_SEG} de seguridad (IDOR, escalada de privilegios, cookie manipulada, XSS almacenado, inyección SQL en buscador, filtros y login, CSRF, enumeración de usuarios, fuerza bruta y cabeceras).",
    f"`lighthouse-3g.mjs`: Lighthouse {LH_VER} con Chrome {CHROME_VER} en modo móvil, tres corridas por página y mediana, con dos perfiles: el **estándar** de Lighthouse móvil (el de PageSpeed Insights: RTT de 150 ms, 1,6 Mbps y CPU 4× más lenta) y el **3G estricto** usado en la auditoría anterior (RTT de 300 ms, 700 kbps y CPU 4×).",
    "`capturas.mjs`: recorrido con Playwright y Chrome que realiza una compra real, entra a los paneles del emprendedor y del administrador y toma las capturas de este informe.",
])
P("Las pruebas se ejecutaron primero en local (servidor de producción con `next start`) y luego sobre la URL pública. Los "
  "resultados de este informe son los de la URL pública.")

H("Proceso de Despliegue", 2)
P("Se evaluaron servicios MySQL gratuitos compatibles con Prisma. Aiven dejó de permitir nuevas bases MySQL gratuitas desde "
  "el 6 de noviembre de 2026 y apagará las existentes el 21 de diciembre de 2026 (Aiven, 2026), por lo que se eligió TiDB "
  "Cloud Starter, que no requiere tarjeta y se conecta con una URL `mysql://` por TLS (PingCAP, s.f.). El procedimiento "
  "(Figura 4) fue: (1) crear la base `mercado_justo` en la región AWS us-east-1, la misma de las funciones de Vercel; "
  "(2) aplicar las migraciones con `prisma migrate deploy` y cargar los datos con `prisma db seed`; (3) subir el código a "
  "GitHub tras verificar que ningún archivo del historial contuviera contraseñas, la cadena de conexión ni el token; (4) "
  "crear el proyecto en Vercel, registrar `DATABASE_URL` y `AUTH_SECRET` como variables secretas y desplegar a producción; "
  "(5) verificar la URL pública con las tres herramientas de prueba. Las contraseñas de las cuentas de prueba se leen de "
  "variables de entorno al ejecutar el seed y no están en el código.")
figura("Proceso de Despliegue", DIA / "despliegue.png", 6.3)

H("Uso de Inteligencia Artificial", 2)
P("Se trabajó con Claude Code (modelo Claude Opus 5.5) como asistente de programación (Anthropic, 2026). El equipo redactó "
  "un *prompt* principal por fases con rol, contexto, restricciones y criterios de aceptación (Anexo A). La IA propuso y "
  "escribió código, scripts de prueba y borradores de texto; el equipo revisó las decisiones y aportó las cuentas y "
  "credenciales de despliegue. Todas las cifras técnicas de este informe provienen de mediciones ejecutadas y las "
  "estadísticas de contexto, de fuentes oficiales citadas; cuando no se encontró una fuente (margen de los intermediarios "
  "en Santa Cruz) no se incluyó ningún número.")

# =====================================================================
# RESULTADOS
# =====================================================================
H("Resultados")
H("Aplicación Publicada", 2)
P(f"La plataforma está disponible en **{URL}** y su código fuente en **{REPO}** (rama `proyecto-final`). La base de datos "
  "en la nube contiene 6 rubros, 8 barrios, 1 administrador, 6 emprendedores aprobados y 31 productos, además de las "
  "compras y cuentas creadas por las pruebas, identificadas como tales.")
H("Funcionalidades", 2)
P("Las figuras siguientes son capturas reales de la URL pública, tomadas por el recorrido automatizado con Playwright.")
figura("Página de Inicio con Cifras Reales de la Plataforma", CAP / "01-inicio.png", 6.0,
       "Las cifras (emprendedores, productos, barrios y comisión) se leen de la base de datos en cada visita.")
figura("Sección «Cómo funciona» con el Flujo de Comercio Justo", CAP / "02-inicio-como-funciona.png", 6.0)
F_CAT = figura("Catálogo General con Filtros por Rubro, Barrio y Emprendedor", CAP / "04-catalogo.png", 6.0,
       "Cada tarjeta indica el emprendimiento, el barrio, el precio, cuánto recibe el productor y un botón de WhatsApp.")
F_BARRIO = figura("Catálogo Filtrado por el Barrio Plan 3000", CAP / "05-catalogo-filtro-barrio.png", 6.0)
F_EMP = figura("Página Pública del Emprendedor Café Chiquitano", CAP / "08-emprendedor-cafe-chiquitano.png", 6.0)
F_CARRITO = figura("Carrito con Productos de Dos Emprendedores", CAP / "10-carrito.png", 6.0,
       "Los productos se agrupan por emprendimiento: cada grupo será un pedido distinto.")
F_CONF = figura("Confirmación de la Compra Repartida en Dos Pedidos", CAP / "12-confirmacion-completa.png", 4.6,
       "Cada pedido muestra su desglose (comisión Bs 0,00 y monto del productor), un QR de pago referencial y un botón para coordinar por WhatsApp.")
F_REG = figura("Registro de un Nuevo Emprendedor", CAP / "13-registro.png", 6.0)
F_PPROD = figura("Panel del Emprendedor: Mis Productos", CAP / "15-panel-productos.png", 6.0)
F_PPED = figura("Panel del Emprendedor: Mis Pedidos tras Cambiar un Estado", CAP / "18-panel-pedido-preparando.png", 6.0)
F_AEMP = figura("Panel del Administrador: Aprobación de Emprendedores", CAP / "20-admin-emprendedores.png", 6.0,
       "La solicitud pendiente y suspendida corresponde a la cuenta creada por la prueba automatizada de XSS: su nombre quedó como texto plano.")
F_APED = figura("Panel del Administrador: Pedidos de Toda la Plataforma", CAP / "21-admin-pedidos.png", 6.0)
F_ESTADO = figura("El Cliente Ve el Estado Actualizado por el Emprendedor", CAP / "23-confirmacion-estado-actualizado.png", 6.0)

# Figura combinada de móvil
from PIL import Image
movil = [Image.open(CAP / f) for f in ("24-movil-inicio.png", "25-movil-catalogo.png", "26-movil-emprendedor.png")]
alto = 1300
movil = [im.resize((int(im.width * alto / im.height), alto)) for im in movil]
lienzo = Image.new("RGB", (sum(im.width for im in movil) + 60, alto), "white")
x = 0
for im in movil:
    lienzo.paste(im, (x, 0)); x += im.width + 30
lienzo.save(CAP / "movil-combinada.png")
figura("Vista Móvil: Inicio, Catálogo y Página de un Emprendedor", CAP / "movil-combinada.png", 6.0)

H("Métricas de Rendimiento (Lighthouse)", 2)
def fila_lh(R, k, etiqueta):
    m = R[k]
    return [etiqueta, m["rendimiento"], seg(m["fcp"]), seg(m["lcp"]), msf(m["tbt"]), num(m["cls"], 3), seg(m["si"]),
            f"{round(m['pesoKB'])} KB", m["accesibilidad"], m["buenasPracticas"], m["seo"]]
ENC_LH = ["Página", "Rend.", "FCP", "LCP", "TBT", "CLS", "SI", "Peso", "Acc.", "BP", "SEO"]
ANCHOS_LH = [1.6, 0.45, 0.5, 0.5, 0.55, 0.5, 0.5, 0.6, 0.4, 0.35, 0.4]
cumple = all(LH_STD[p]["rendimiento"] >= 90 for p, _ in PAGS)
P(f"La Tabla {CONT['Tabla'] + 1} muestra la mediana de tres corridas de Lighthouse móvil con el perfil estándar sobre la "
  f"URL pública. {'Las cuatro páginas superan' if cumple else 'No todas las páginas alcanzan'} el umbral de 90 puntos "
  f"fijado en el requisito RNF01; el promedio de rendimiento fue de {num(prom(LH_STD, 'rendimiento'), 0)} puntos y el CLS "
  "fue prácticamente nulo en todas.")
tabla("Lighthouse Móvil, Perfil Estándar, sobre la URL Pública (Mediana de 3 Corridas)", ENC_LH,
      [fila_lh(LH_STD, k, e) for k, e in PAGS], ANCHOS_LH,
      "Rend. = rendimiento; Acc. = accesibilidad; BP = buenas prácticas; SI = Speed Index. Perfil estándar de Lighthouse móvil "
      "(RTT 150 ms, 1,6 Mbps, CPU 4×).", tam=8.5, resaltar_col=1)
rango = [c["rendimiento"] for k, _ in PAGS for c in LH_STD[k]["corridas"]]
P(f"En las {len(rango)} corridas individuales el puntaje varió entre {min(rango)} y {max(rango)}, por la variación propia "
  "del *throttling* simulado; por eso se informa la mediana. Las Figuras siguientes son los reportes reales de la corrida "
  "mediana del inicio y del catálogo.")
figura("Reporte de Lighthouse Móvil del Inicio (URL Pública, Perfil Estándar)", CAP / "lh-nube-estandar-inicio.png", 6.0)
figura("Reporte de Lighthouse Móvil del Catálogo (URL Pública, Perfil Estándar)", CAP / "lh-nube-estandar-catalogo.png", 6.0)
P(f"Con el perfil 3G estricto (Tabla {CONT['Tabla'] + 1}) el puntaje baja a un promedio de "
  f"{num(prom(LH_3G, 'rendimiento'), 0)} y el LCP sube a {seg(prom(LH_3G, 'lcp'))} en promedio, por encima de los 2,5 s "
  "recomendados. Es el mismo comportamiento que registró la auditoría de Café Chiquitano: bajo 3G el tiempo lo dominan el "
  "JavaScript del *framework* y la descarga de la primera imagen, no el contenido nuevo de la plataforma.")
tabla("Lighthouse Móvil, Perfil 3G Estricto, sobre la URL Pública (Mediana de 3 Corridas)", ENC_LH,
      [fila_lh(LH_3G, k, e) for k, e in PAGS], ANCHOS_LH,
      "Perfil 3G de la auditoría anterior: RTT 300 ms, 700 kbps, CPU 4×.", tam=8.5, resaltar_col=1)
P("Durante el desarrollo, la primera medición local del catálogo con el perfil estándar dio 83 puntos porque se dibujaban "
  "e hidrataban las 31 tarjetas a la vez. Se decidió mostrar 12 productos y un botón «Mostrar más»; los filtros siguen "
  "trabajando sobre todos los productos en memoria. Esa decisión, junto con la carga diferida de imágenes heredada de la "
  "auditoría, explica que el catálogo mantenga un TBT bajo pese a tener casi el triple de productos que el menú original.")

H("Pruebas de Seguridad y Funcionales", 2)
P(f"La Tabla {CONT['Tabla'] + 1} resume los {N_PRUEBAS} casos ejecutados contra la URL pública el "
  f"{PRUEBAS['fecha'][8:10]}/{PRUEBAS['fecha'][5:7]}/{PRUEBAS['fecha'][:4]}: pasaron {N_PASAN}. Entre los resultados más "
  "relevantes: una cookie de sesión manipulada para cambiar el rol a ADMIN fue rechazada por la firma HMAC; un emprendedor "
  "no pudo editar un producto ni un pedido ajeno (respuesta 404, sin revelar que existe); una petición con la cookie del "
  "administrador pero enviada desde otro origen fue rechazada (CSRF); el nombre `Tejidos <script>alert('xss')</script>` se "
  "guardó como texto plano; las cargas de inyección SQL no devolvieron datos; y al quinto intento fallido la cuenta se "
  "bloqueó incluso para la contraseña correcta.")
tabla("Resultados de las Pruebas Automatizadas sobre la URL Pública",
      ["ID", "Caso", "Resultado", "Evidencia"],
      [[c["id"], c["descripcion"], c["resultado"], c["detalle"][:90]] for c in PRUEBAS["resultados"]],
      [0.45, 2.75, 0.65, 2.45], f"F = funcional; S = seguridad. Fuente: `informe-final/resultados/prueba-funcional-nube.json`.", tam=8)

H("Cumplimiento de Requisitos", 2)
tabla("Requisitos Cumplidos y Evidencia", ["Requisito", "Estado", "Evidencia"], [
    ["RF01 Registro de emprendedores", "Cumplido", f"F17, S07, S08; Figura {F_REG}"],
    ["RF02 Aprobación por el admin", "Cumplido", f"F18, F19, S09; Figura {F_AEMP}"],
    ["RF03 Inicio de sesión por rol", "Cumplido", "F10, F11, S04"],
    ["RF04 CRUD solo de productos propios", "Cumplido", f"F15, F16, S01; Figura {F_PPROD}"],
    ["RF05 Página pública del emprendedor", "Cumplido", f"F05; Figura {F_EMP}"],
    ["RF06 Catálogo filtrable", "Cumplido", f"F01–F04; Figuras {F_CAT} y {F_BARRIO}"],
    ["RF07 Comercio justo visible", "Cumplido", f"F08; Figuras {F_CAT} y {F_CONF}"],
    ["RF08 WhatsApp directo", "Cumplido", f"F05, F09; Figuras {F_EMP} y {F_CONF}"],
    ["RF09 Compra multivendedor", "Cumplido", f"F06, F07; Figuras {F_CARRITO} y {F_CONF}"],
    ["RF10 QR de pago referencial", "Cumplido", f"F09; Figura {F_CONF}"],
    ["RF11 Pedidos por emprendedor y supervisión", "Cumplido", f"F12–F14, S02; Figuras {F_PPED}, {F_APED} y {F_ESTADO}"],
    ["RF12 Seed de 6 emprendedores y 31 productos", "Cumplido", "F01 (31 productos, 6 emprendedores)"],
    ["RNF01 Lighthouse móvil ≥ 90", "Cumplido" if cumple else "Parcial", f"Tabla {CONT['Tabla'] - 2} (perfil estándar); bajo 3G estricto no se alcanza"],
    ["RNF02 Seguridad", "Cumplido", "S01–S17"],
    ["RNF03 Publicada con HTTPS", "Cumplido", URL],
    ["RNF04 Responsiva y accesible", "Cumplido", f"Figura {CONT['Figura']}; accesibilidad Lighthouse ≥ {minimo(LH_STD, 'accesibilidad')}"],
    ["RNF05 Integridad de datos", "Cumplido", f"Figura {F_ER}; F07 (total recalculado en el servidor)"],
    ["RNF06 Secretos fuera de GitHub", "Cumplido", "Revisión del historial antes del push; .gitignore y variables secretas en Vercel"],
], [2.3, 0.9, 3.1], tam=9)

# =====================================================================
# DISCUSIÓN
# =====================================================================
H("Discusión")
H("Cómo la Plataforma Responde al Problema Contextual", 2)
P("Cada parte del problema tiene una respuesta concreta en la plataforma. Contra **la falta de canal digital**, cada "
  "microempresario obtiene una página propia con su historia y un catálogo que llega a toda la ciudad, desde un celular y "
  "sin instalar nada. Contra **la dependencia de intermediarios**, el productor fija su precio, recibe el pedido en su panel, "
  "coordina directamente con el cliente por WhatsApp y cobra con su propio QR; la plataforma no toca el dinero y su comisión "
  "es 0 %. Contra **la informalidad y la desconfianza**, el comprador ve quién produce, en qué barrio y cuánto recibe, y el "
  "productor tiene por primera vez un registro ordenado de pedidos, ventas del día y estados, que puede servirle como "
  "historial para formalizarse o pedir un crédito.")
P("Respecto de la pregunta de investigación, los resultados muestran que sí es técnicamente posible: la plataforma funciona "
  f"en una URL pública con servicios gratuitos, superó {N_PASAN} de {N_PRUEBAS} pruebas funcionales y de seguridad y obtuvo "
  f"un rendimiento móvil de {std_min} puntos o más con el perfil estándar. Lo que estos resultados no demuestran es el "
  "impacto económico: eso requiere un piloto con emprendedores reales.")
H("Comparación con la Situación Inicial", 2)
tabla("Situación Inicial y Situación con la Plataforma", ["Aspecto", "Situación inicial", "Con Mercado Justo Cruceño"], [
    ["Alcance de venta", "Vecinos, contactos de WhatsApp y ferias del barrio", "Clientes de toda la ciudad con un enlace propio"],
    ["Precio", "Lo fija el intermediario o el revendedor", "Lo fija el productor; comisión de la plataforma 0 %"],
    ["Pedidos", "Mensajes y llamadas sueltos, sin registro", "Panel con pedidos, estados y ventas del día"],
    ["Pago", "Efectivo, a veces a 30 días (distribuidoras)", "Directo al productor por QR o efectivo al entregar"],
    ["Confianza", "El comprador no sabe quién produce", "Historia, barrio y perfil revisado por la administración"],
    ["Tecnología (Café Chiquitano)", "Una tienda de un solo negocio, en localhost", "Plataforma multivendedor publicada con HTTPS"],
], [1.5, 2.3, 2.5], tam=9.5)
H("Comparación con Soluciones Existentes", 2)
P(f"La Tabla {CONT['Tabla'] + 1} compara la plataforma con las alternativas que hoy usa un microemprendedor. La comparación es "
  "cualitativa: no se encontraron fuentes oficiales con las comisiones vigentes de cada servicio en Bolivia, por lo que no "
  "se citan porcentajes.")
tabla("Comparación Cualitativa con Alternativas", ["Alternativa", "Fortaleza", "Limitación frente al problema"], [
    ["Redes sociales y WhatsApp Business", "Gratis y conocidas", "No ordenan pedidos, no agrupan productores ni muestran lo que recibe el productor"],
    ["Aplicaciones de reparto", "Logística y gran audiencia", "Cobran comisión por pedido y están pensadas para restaurantes formales"],
    ["Tienda en línea propia", "Control total de la marca", "Requiere conocimientos, dominio y pago mensual"],
    ["Ferias presenciales", "Contacto directo y confianza", "Solo fines de semana, dependen del clima y del traslado"],
    ["Mercado Justo Cruceño", "Gratis, colectiva, sin comisión, con historia del productor", "Aún sin pasarela de pago real ni logística de entrega"],
], [1.7, 1.9, 2.7], tam=9.5)
H("Aporte a los Objetivos de Desarrollo Sostenible", 2)
tabla("Vinculación con los ODS", ["ODS", "Aporte concreto"], [
    ["ODS 4 · Educación de calidad", "Panel simple y guías integradas para que el emprendedor aprenda a vender en línea; el código, los scripts y este informe quedan como material reproducible para otros estudiantes."],
    ["ODS 8 · Trabajo decente y crecimiento económico", "Precio fijado por el productor, cobro directo y registro de ventas que facilita la formalización; la plataforma no cobra comisión."],
    ["ODS 9 · Industria, innovación e infraestructura", "Infraestructura digital en la nube, segura y rápida, construida con servicios gratuitos y buenas prácticas (OWASP, Core Web Vitals)."],
    ["ODS 10 · Reducción de las desigualdades", "Los barrios periurbanos acceden al mismo mercado digital que el centro; la optimización para móviles y redes lentas reduce el consumo de datos."],
], [2.0, 4.3], tam=9.5)
H("Ejes Transversales", 2)
vinetas([
    "**Tecnologías emergentes e inteligencia artificial:** desarrollo asistido por IA con verificación humana y mediciones propias; despliegue en la nube sin servidores propios.",
    "**Emprendedurismo e innovación:** el producto es en sí un modelo de negocio social: una plataforma colectiva sostenible por programas municipales, universitarios o de cooperación, no por comisiones.",
    "**Investigación en el aula:** se formuló una pregunta, se definieron criterios de aceptación medibles y se reportaron también los resultados desfavorables (3G estricto).",
    "**Responsabilidad social y ética:** personas, negocios y teléfonos son ficticios; las fotos de los perfiles son de productos y no de personas reales; el QR se identifica como referencial; las credenciales nunca se publicaron.",
])
H("Limitaciones", 2)
vinetas([
    "El QR de pago es referencial: no se integró una pasarela ni el QR interoperable de un banco.",
    "Los emprendedores, las historias y los números de WhatsApp son ficticios; no hubo validación con usuarios reales.",
    "Las fotos se enlazan por URL https; no hay subida de archivos desde el celular.",
    "El plan gratuito de TiDB Cloud y Vercel tiene cuotas mensuales; con mucho tráfico habría que pasar a un plan pago.",
    "Bajo el perfil 3G estricto el LCP supera los 2,5 s y el puntaje queda por debajo de 90.",
    "Los barrios y sus zonas son referenciales y no se cotejaron con el catastro municipal.",
])
H("Trabajo Futuro", 2)
vinetas([
    "Piloto con 5 a 10 microemprendedores reales de un barrio, midiendo ventas, tiempo de respuesta y percepción de precio justo.",
    "Integrar el QR interoperable de cada emprendedor (imagen subida a un almacenamiento de archivos) y notificaciones por WhatsApp.",
    "Subida de fotos optimizadas desde el celular y modo sin conexión (PWA) para zonas con mala cobertura.",
    "Indicadores de impacto por barrio y rubro para que la alcaldía u ONG aliadas focalicen apoyo.",
])

# =====================================================================
# CONCLUSIONES Y RECOMENDACIONES
# =====================================================================
H("Conclusiones")
vinetas([
    f"Se desarrolló y publicó Mercado Justo Cruceño en {URL}: una plataforma multivendedor de comercio justo con roles, registro y aprobación de emprendedores, catálogo filtrable, páginas públicas, compra multivendedor, comisión visible del 0 %, WhatsApp directo y QR referencial.",
    "La evolución desde Café Chiquitano reutilizó la seguridad y las optimizaciones de la auditoría y las extendió al nuevo alcance con control de acceso por rol verificado contra la base, protección contra IDOR, CSRF y fuerza bruta, y contraseñas con bcrypt.",
    f"Las {N_PASAN} de {N_PRUEBAS} pruebas superadas sobre la URL pública y las capturas de una compra real demuestran que la plataforma cumple los doce requisitos funcionales.",
    f"El rendimiento móvil con el perfil estándar de Lighthouse fue de {std_min} puntos o más en las cuatro páginas; bajo 3G estricto el LCP sigue siendo el principal desafío, igual que en la auditoría anterior.",
    "Con servicios gratuitos (TiDB Cloud Starter, Vercel y GitHub) es viable ofrecer a los microempresarios periurbanos un canal digital propio sin intermediarios; su impacto económico queda por medir en un piloto real.",
])
H("Recomendaciones")
vinetas([
    "Validar la plataforma con emprendedores reales de un barrio antes de ampliarla, con acompañamiento presencial para la carga de productos.",
    "Buscar un aliado institucional (alcaldía, universidad u ONG) que financie la operación y mantenga la comisión en 0 % o en un porcentaje bajo y publicado.",
    "Antes de manejar pagos reales, integrar un proveedor regulado y someter la aplicación a una nueva auditoría OWASP.",
    "Conectar el repositorio de GitHub con Vercel para que cada cambio se despliegue automáticamente, y activar copias de seguridad de la base.",
    "Mantener las pruebas automatizadas y Lighthouse como parte de cada entrega para no perder la seguridad ni el rendimiento logrados.",
])
salto()

# =====================================================================
# REFERENCIAS (APA 7)
# =====================================================================
H("Referencias")
REFS = [
    "Aiven. (2026). *Free MySQL database retired*. https://aiven.io/free-mysql-database-retired",
    "Anthropic. (2026). *Claude Code* (Claude Opus 5.5) [Asistente de programación basado en un modelo de lenguaje]. https://claude.com/product/claude-code",
    "Autoridad de Regulación y Fiscalización de Telecomunicaciones y Transportes. (2025). *Estado de situación de las telecomunicaciones en Bolivia 2024*. https://www.att.gob.bo/sites/default/files/archivos_listados_pdf/2025-10-28/Estado%20de%20situacion%20de%20las%20telecomunicaciones%20en%20Bolivia%202024.pdf",
    "Banco Central de Bolivia. (2026). *Informe de vigilancia del sistema de pagos 2025*. https://www.bcb.gob.bo/webdocs/publicacionesbcb/2026/05/24/IVSP%202025vf.pdf",
    "Banco Mundial. (s.f.). *Personas que usan Internet (% de la población) – Bolivia* [Conjunto de datos con base en la UIT]. https://datos.bancomundial.org/indicador/IT.NET.USER.ZS?locations=BO",
    "Comisión Económica para América Latina y el Caribe. (s.f.). *Acerca de microempresas y pymes*. https://www.cepal.org/es/temas/micro-pequenas-medianas-empresas-mipyme/acerca-microempresas-pymes",
    "Elmasri, R. y Navathe, S. B. (2016). *Fundamentals of database systems* (7.ª ed.). Pearson.",
    "Google. (s.f.). *Lighthouse performance scoring*. Chrome for Developers. https://developer.chrome.com/docs/lighthouse/performance/performance-scoring",
    "Instituto Nacional de Estadística. (2024). *Somos 11.312.620 bolivianos y Santa Cruz es el departamento que más creció y más poblado*. https://cpv2024.ine.gob.bo/index.php/somos-11-312-620-bolivianos-y-santa-cruz-es-el-departamento-que-mas-crecio-y-mas-poblado/",
    "Instituto Nacional de Estadística. (2025). *Censo 2024: ocho de cada 10 cruceños viven en áreas urbanas del departamento de Santa Cruz*. https://cpv2024.ine.gob.bo/index.php/censo-2024-ocho-de-cada-10-crucenos-viven-en-areas-urbanas-del-departamento-de-santa-cruz/",
    "Naciones Unidas. (s.f.). *Objetivos de Desarrollo Sostenible*. https://www.un.org/sustainabledevelopment/es/objetivos-de-desarrollo-sostenible/",
    "Organización Internacional del Trabajo. (2025). *Panorama laboral 2025: América Latina y el Caribe*. https://www.ilo.org/sites/default/files/2025-12/OIT-Informe-PANORAMA-LABORAL-2025.pdf",
    "OWASP Foundation. (2025). *OWASP Top 10:2025*. https://owasp.org/Top10/2025/",
    "PingCAP. (s.f.). *Connect to TiDB with Prisma*. TiDB Documentation. https://docs.pingcap.com/developer/dev-guide-sample-application-nodejs-prisma/",
    "Prisma. (s.f.). *Prisma ORM documentation*. https://www.prisma.io/docs/orm",
    "Schwaber, K. y Sutherland, J. (2020). *La guía de Scrum*. https://scrumguides.org/scrum-guide.html",
    "van Dijk, J. (2020). *The digital divide*. Polity Press.",
    "Vercel. (2026a). *Next.js documentation*. https://nextjs.org/docs",
    "Vercel. (2026b). *Environment variables*. Vercel Documentation. https://vercel.com/docs/environment-variables",
    "Walton, P. (2024, 31 de octubre). *Web Vitals*. web.dev. https://web.dev/articles/vitals",
    "World Fair Trade Organization. (s.f.). *Our 10 fair trade principles*. https://wfto.com/our-fair-trade-system/our-10-principles-of-fair-trade/",
]
for ref in sorted(REFS, key=lambda r: re.sub(r"[*()]", "", r).lower().replace("van dijk", "dijk")):
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Inches(-0.5); p.paragraph_format.left_indent = Inches(0.5)
    runs(p, ref)
salto()

# =====================================================================
# ANEXOS
# =====================================================================
H("Anexos")
H("Anexo A: Prompts Utilizados y Técnica Aplicada", 2)
tabla("Prompts Utilizados en el Proyecto Final", ["N.º", "Prompt (resumido)", "Propósito", "Técnica"], [
    ["1", "«Actúa como ingeniero de software senior, experto en Next.js, despliegue en la nube e informes técnicos académicos».", "Fijar el nivel técnico", "Asignación de rol"],
    ["2", "Contexto: proyecto final UPDS, docente, título, fecha de entrega, app Café Chiquitano ya auditada; la rúbrica exige app desplegada, IMRyD y resolver el problema contextual.", "Dar el escenario y los criterios de evaluación", "Contexto explícito"],
    ["3", "«Crea la rama proyecto-final y un commit de respaldo. NO modifiques informe/ ni informe-auditoria/».", "Proteger entregas anteriores", "Precondiciones y restricciones negativas"],
    ["4", "Fase 1: modelo Emprendedor, roles ADMIN/EMPRENDEDOR con bcrypt, registro con limpiarTexto, catálogo por rubro/barrio/emprendedor, comercio justo visible, seed de 6 emprendedores y ~30 productos; «mantén Lighthouse ≥ 90 y pruébalo todo».", "Especificar el alcance funcional", "Descomposición en tareas + criterios de aceptación"],
    ["5", "Fase 2: «investiga y recomiéndame una base MySQL gratuita… espera mis datos y NUNCA subas el .env».", "Despliegue seguro con intervención humana", "Investigación guiada + humano en el bucle"],
    ["6", "Fase 3: estructura IMRyD completa, ODS y ejes; «usa SOLO datos con fuente real; si no encuentras una fuente, no inventes el número».", "Informe académico verificable", "Plantilla de salida + instrucción anti-alucinación"],
    ["7", "Fase 4: presentación de 15–18 diapositivas, mismo estilo, con URL y QR.", "Definir el formato de la defensa", "Formato de salida"],
    ["8", "«Trabaja por fases, pruébalo todo y al final dame la URL, los usuarios de prueba, lo que cambió y qué mostrar en la defensa».", "Verificación incremental y cierre", "Encadenamiento por fases + resumen final"],
    ["9", "«Listo. El archivo .env.nube ya tiene DATABASE_URL y VERCEL_TOKEN… Continúa con la Fase 2».", "Entregar credenciales sin exponerlas en el chat", "Confirmación con datos fuera del prompt"],
], [0.4, 2.8, 1.6, 1.5], "Los prompts se citan resumidos.", tam=8.5)

H("Anexo B: Manual de Usuario Breve", 2)
P("**Cliente (sin cuenta).** (1) Entre a la URL o escanee el código QR de la presentación. (2) En *Catálogo* elija un rubro, "
  "un barrio o un emprendedor, o use el buscador. (3) Pulse *Agregar* en los productos que desee; puede mezclar productos de "
  "varios emprendedores. (4) Abra el carrito, escriba su nombre y su celular y pulse *Confirmar pedido*. (5) En la "
  "confirmación verá un pedido por emprendedor: use *Coordinar entrega por WhatsApp* y pague directo al productor. Guarde el "
  "enlace para consultar el estado.", sangria=False)
P("**Emprendedor.** (1) En *Vende aquí* complete el registro con su historia y su WhatsApp. (2) Mientras la administración "
  "revisa su solicitud, entre a *Mi panel* y cargue sus productos con *Nuevo producto*. (3) Cuando llegue un pedido, "
  "escriba al cliente con el enlace de WhatsApp del pedido y cambie su estado a *Preparando* y luego a *Entregado*. "
  "(4) Use *Disponible* para marcar un producto agotado y *Mi perfil* para actualizar su historia.", sangria=False)
P("**Administrador.** (1) Ingrese con la cuenta de administración. (2) En *Emprendedores* revise las solicitudes pendientes "
  "y pulse *Aprobar emprendedor*; use *Suspender cuenta* ante un incumplimiento. (3) En *Pedidos* supervise la actividad y "
  "en *Productos* oculte los que no cumplan las normas.", sangria=False)
P("Las cuentas de prueba usan el dominio reservado `@mercadojusto.test` (por ejemplo `admin@mercadojusto.test` y "
  "`cafechiquitano@mercadojusto.test`); sus contraseñas se entregan al docente por separado y no figuran en este documento "
  "ni en el repositorio público.", sangria=False)
H("Anexo C: Código QR de la Aplicación", 2)
p = P("", sangria=False, centrado=True)
p.add_run().add_picture(str(REC / "qr-url.png"), width=Inches(2.2))
P(URL, sangria=False, centrado=True)
H("Anexo D: Cómo Reproducir las Pruebas", 2)
codigo('''# Pruebas funcionales y de seguridad (36 casos) contra cualquier URL
BASE=https://mercado-justo-cruceno.vercel.app ADMIN_PASS=... EMP_PASS=... \\
  node informe-final/scripts/prueba-funcional.mjs resultados.json

# Lighthouse móvil: perfil estándar y 3G estricto, 3 corridas, mediana
PERFIL=estandar LH_CLI=.../lighthouse/cli/index.js node informe-final/scripts/lighthouse-3g.mjs nube=URL
LH_CLI=.../lighthouse/cli/index.js node informe-final/scripts/lighthouse-3g.mjs nube-3g=URL

# Recorrido con capturas (Playwright + Chrome instalado)
PW=.../playwright-core BASE=URL ADMIN_PASS=... EMP_PASS=... node informe-final/scripts/capturas.mjs capturas''')

doc.save(str(SALIDA))
print("OK", SALIDA)
