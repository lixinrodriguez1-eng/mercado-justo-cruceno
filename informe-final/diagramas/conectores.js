// Dibuja conectores entre cajas posicionadas en #lienzo.
// conectar("a", "derecha", "b", "izquierda", { a: "1", b: "N", texto: "tiene", punteada: false, flecha: false })
// Los lados admiten un desplazamiento: "derecha:0.3" (0 = arriba/izquierda, 1 = abajo/derecha).
function punto(id, lado) {
  const lienzo = document.getElementById("lienzo").getBoundingClientRect();
  const r = document.getElementById(id).getBoundingClientRect();
  const [nombre, f] = lado.split(":");
  const t = f === undefined ? 0.5 : Number(f);
  const x0 = r.left - lienzo.left, y0 = r.top - lienzo.top;
  switch (nombre) {
    case "derecha": return { x: x0 + r.width, y: y0 + r.height * t, dx: 1, dy: 0 };
    case "izquierda": return { x: x0, y: y0 + r.height * t, dx: -1, dy: 0 };
    case "arriba": return { x: x0 + r.width * t, y: y0, dx: 0, dy: -1 };
    default: return { x: x0 + r.width * t, y: y0 + r.height, dx: 0, dy: 1 };
  }
}

function conectar(a, ladoA, b, ladoB, o = {}) {
  const svg = document.querySelector("svg.lineas");
  const p = punto(a, ladoA), q = punto(b, ladoB);
  const ns = "http://www.w3.org/2000/svg";
  let d;
  if (p.dx !== 0 && q.dx !== 0) {
    const mx = (p.x + q.x) / 2;
    d = `M${p.x},${p.y} H${mx} V${q.y} H${q.x}`;
  } else if (p.dy !== 0 && q.dy !== 0) {
    const my = (p.y + q.y) / 2;
    d = `M${p.x},${p.y} V${my} H${q.x} V${q.y}`;
  } else if (p.dx !== 0) {
    d = `M${p.x},${p.y} H${q.x} V${q.y}`;
  } else {
    d = `M${p.x},${p.y} V${q.y} H${q.x}`;
  }
  const camino = document.createElementNS(ns, "path");
  camino.setAttribute("d", d);
  camino.setAttribute("fill", "none");
  camino.setAttribute("stroke", o.color ?? "#6f4630");
  camino.setAttribute("stroke-width", o.grosor ?? 2.2);
  if (o.punteada) camino.setAttribute("stroke-dasharray", "7 5");
  if (o.flecha) camino.setAttribute("marker-end", "url(#flecha)");
  svg.appendChild(camino);
  const etiqueta = (pt, texto) => {
    if (!texto) return;
    const t = document.createElementNS(ns, "text");
    t.setAttribute("class", "etq");
    t.setAttribute("x", pt.x + (pt.dx === 0 ? 7 : pt.dx * 10) - (pt.dx < 0 ? 12 : 0));
    t.setAttribute("y", pt.y + (pt.dy === 0 ? -6 : pt.dy * 18));
    t.textContent = texto;
    svg.appendChild(t);
  };
  etiqueta(p, o.a);
  etiqueta(q, o.b);
  if (o.texto) {
    const largo = camino.getTotalLength();
    const m = camino.getPointAtLength(largo / 2);
    const t = document.createElementNS(ns, "text");
    t.setAttribute("x", m.x + 6);
    t.setAttribute("y", m.y - 6);
    t.setAttribute("style", "font: italic 13px 'Segoe UI'; fill: #6f4630");
    t.textContent = o.texto;
    svg.appendChild(t);
  }
}

function prepararSvg() {
  const lienzo = document.getElementById("lienzo");
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "lineas");
  svg.innerHTML = `<defs><marker id="flecha" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#6f4630"/></marker></defs>`;
  lienzo.prepend(svg);
}
