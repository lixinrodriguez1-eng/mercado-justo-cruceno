// Prueba unitaria del saneamiento XSS. Uso: npx tsx informe-auditoria/scripts/prueba-xss-unitaria.ts
import { limpiarTexto, validarPedido } from "../../lib/validacion";
const casos = [
  "&lt;svg onload=alert(1)&gt; leche deslactosada",
  "<script>alert(1) sin cerrar",
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "Sin azúcar <script>alert('xss')</script> por favor",
  "<svg/onload=alert(1)>",
  "&lt;script&gt;alert(1)&lt;/script&gt;",
  "&#60;img src=x onerror=alert(1)&#62;",
  "＜script＞alert(1)＜/script＞",
  '<a href="javascript:alert(1)">clic</a>',
  "javascript:alert(1)",
  "<iframe src=//evil.com></iframe>Latte",
  "Capuchino con leche de almendras, 2 de azúcar",
  "María José O'Brien-Suárez",
  "<b>Ana</b> Rojas",
  "Café < 5 Bs y > 3 Bs",
  "texto\u0000con​control",
];
for (const c of casos) console.log(JSON.stringify(c).padEnd(62), "→", JSON.stringify(limpiarTexto(c)));
console.log(JSON.stringify(validarPedido({ cliente: "<script>alert(1)</script>", telefono: "71234567", items: [{ productoId: 1, cantidad: 1 }] })));
console.log(JSON.stringify(validarPedido({ cliente: "<img src=x onerror=alert(1)>Ana Rojas", telefono: "71234567", nota: "<img src=x onerror=alert(1)>", items: [{ productoId: 1, cantidad: 1 }] })));
