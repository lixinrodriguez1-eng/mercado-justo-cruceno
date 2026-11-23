# -*- coding: utf-8 -*-
"""Gráfico antes/después (mediana de 9 corridas) para el informe. Uso: python grafico-antes-despues.py"""
import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

RES = Path(__file__).resolve().parents[1] / "resultados"
CAP = Path(__file__).resolve().parents[1] / "capturas"
A = json.loads((RES / "antes" / "resumen.json").read_text(encoding="utf-8"))
D = json.loads((RES / "despues" / "resumen.json").read_text(encoding="utf-8"))
PAGS = [("inicio", "Inicio"), ("menu", "Menú"), ("carrito", "Carrito")]
C_ANTES, C_DESP, TEXTO, REJILLA = "#B98E70", "#B9471C", "#3D2618", "#EFE0CC"

plt.rcParams.update({"font.family": "Calibri", "font.size": 10, "axes.edgecolor": REJILLA, "text.color": TEXTO,
                     "axes.labelcolor": TEXTO, "xtick.color": TEXTO, "ytick.color": "#8A5A3C"})
fig, ejes = plt.subplots(1, 4, figsize=(11, 3.4))
metricas = [("rendimiento", "Puntaje de rendimiento", lambda v: v, "{:.0f}", "más es mejor"),
            ("tbt", "TBT (ms)", lambda v: v, "{:.0f}", "menos es mejor"),
            ("lcp", "LCP (s)", lambda v: v / 1000, "{:.2f}", "menos es mejor"),
            ("pesoKB", "Peso total (KB)", lambda v: v, "{:.0f}", "menos es mejor")]
x = range(len(PAGS))
for eje, (clave, titulo, f, fmt, sentido) in zip(ejes, metricas):
    va = [f(A[p][clave]) for p, _ in PAGS]
    vd = [f(D[p][clave]) for p, _ in PAGS]
    b1 = eje.bar([i - 0.19 for i in x], va, 0.36, color=C_ANTES, label="Antes")
    b2 = eje.bar([i + 0.19 for i in x], vd, 0.36, color=C_DESP, label="Después")
    for barras, vals in ((b1, va), (b2, vd)):
        for b, v in zip(barras, vals):
            eje.annotate(fmt.format(v).replace(".", ","), (b.get_x() + b.get_width() / 2, b.get_height()),
                         ha="center", va="bottom", fontsize=8.5, xytext=(0, 2), textcoords="offset points")
    eje.set_xticks(list(x), [n for _, n in PAGS])
    eje.set_title(f"{titulo}\n({sentido})", fontsize=10.5, color=TEXTO, fontweight="bold")
    eje.grid(axis="y", color=REJILLA, linewidth=0.6); eje.set_axisbelow(True)
    for lado in ("top", "right", "left"):
        eje.spines[lado].set_visible(False)
    eje.set_ylim(0, max(va + vd) * 1.18)
# Leyenda única debajo de los gráficos para que no tape las barras
manejadores, etiquetas = ejes[0].get_legend_handles_labels()
fig.legend(manejadores, etiquetas, frameon=False, loc="lower center", ncol=2, fontsize=10)
fig.suptitle("Café Chiquitano · Lighthouse móvil con 3G simulado · mediana de 9 corridas", fontsize=11.5, color=TEXTO)
fig.tight_layout(rect=(0, 0.07, 1, 1))
fig.savefig(CAP / "grafico-antes-despues.png", dpi=200, facecolor="white")
print("✓ grafico-antes-despues.png")
