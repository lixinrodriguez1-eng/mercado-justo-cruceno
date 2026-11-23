// =============================================================
// Pruebas de ataque DEFENSIVAS contra la propia app (solo localhost).
// Uso:  ADMIN_PASSWORD=... node prueba-ataques.mjs [urlBase]
// 1. XSS almacenado en el formulario de pedido (cliente y nota).
// 2. XSS almacenado en el panel admin (nombre y descripción del producto).
// 3. Inyección SQL en la búsqueda, en el id de la URL y en el login.
// Envía las peticiones directamente a la API (como haría un atacante con
// curl o Postman), saltándose cualquier validación del navegador.
// =============================================================
const base = process.argv[2] ?? "http://localhost:3005";
const log = (...a) => console.log(...a);

async function pedir(ruta, opciones = {}) {
  const r = await fetch(base + ruta, {
    ...opciones,
    headers: { "Content-Type": "application/json", ...opciones.headers },
  });
  const texto = await r.text();
  let cuerpo;
  try { cuerpo = JSON.parse(texto); } catch { cuerpo = texto.slice(0, 120); }
  return { status: r.status, cuerpo, headers: r.headers };
}

log("=== 1. XSS en el formulario de pedido (POST /api/pedidos) ===");
const ataquesPedido = [
  { cliente: "<script>alert(1)</script>", nota: "intento 1" },
  { cliente: "<img src=x onerror=alert(1)>Prueba XSS", nota: "<script>alert('xss')</script>Sin azúcar" },
  { cliente: "Prueba XSS Dos", nota: "<img src=x onerror=alert(document.cookie)>Para llevar" },
  { cliente: "Prueba XSS Tres", nota: "&lt;svg onload=alert(1)&gt; leche deslactosada" },
];
const codigos = [];
for (const datos of ataquesPedido) {
  const r = await pedir("/api/pedidos", {
    method: "POST",
    body: JSON.stringify({ ...datos, telefono: "71234567", items: [{ productoId: 1, cantidad: 1 }] }),
  });
  log(`Enviado  cliente=${JSON.stringify(datos.cliente)}  nota=${JSON.stringify(datos.nota)}`);
  if (r.status === 201) {
    codigos.push(r.cuerpo.codigo);
    log(`  → ${r.status} guardado como cliente=${JSON.stringify(r.cuerpo.cliente)} nota=${JSON.stringify(r.cuerpo.nota)}  (id ${r.cuerpo.id})`);
  } else log(`  → ${r.status} rechazado:`, JSON.stringify(r.cuerpo.errores ?? r.cuerpo));
}

log("\n=== 2. XSS en el panel admin (POST /api/admin/productos) ===");
const login = await pedir("/api/auth", { method: "POST", body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }) });
const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
log("Login admin:", login.status);
const producto = await pedir("/api/admin/productos", {
  method: "POST",
  headers: { cookie },
  body: JSON.stringify({
    nombre: "<script>alert('admin')</script>Prueba XSS Mocha",
    descripcion: "<img src=x onerror=alert(1)>Mocha de prueba para la auditoría <b>OWASP</b>",
    precio: 20,
    imagen: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=75&auto=format&fit=crop",
    categoriaId: 1,
    disponible: true,
    destacado: false,
  }),
});
log(`  → ${producto.status} nombre=${JSON.stringify(producto.cuerpo.nombre)} descripcion=${JSON.stringify(producto.cuerpo.descripcion)} (id ${producto.cuerpo.id})`);
const imagenMala = await pedir("/api/admin/productos", {
  method: "POST",
  headers: { cookie },
  body: JSON.stringify({ nombre: "X", descripcion: "Imagen maliciosa", precio: 5, categoriaId: 1, imagen: 'javascript:alert(1)' }),
});
log(`  imagen=javascript:alert(1) → ${imagenMala.status}`, JSON.stringify(imagenMala.cuerpo.errores));

log("\n=== 3. Inyección SQL ===");
const total = (await pedir("/api/productos")).cuerpo.length;
log(`Productos disponibles (sin filtro): ${total}`);
for (const q of ["' OR '1'='1", "%' OR 1=1 -- ", "'; DROP TABLE productos; -- ", "latte"]) {
  const r = await pedir(`/api/productos?q=${encodeURIComponent(q)}`);
  log(`  búsqueda q=${JSON.stringify(q).padEnd(34)} → ${r.status}, ${Array.isArray(r.cuerpo) ? r.cuerpo.length : "-"} resultados`);
}
for (const id of ["1 OR 1=1", "1;DROP TABLE pedidos"]) {
  const r = await pedir(`/api/productos/${encodeURIComponent(id)}`);
  log(`  /api/productos/${id.padEnd(22)} → ${r.status} ${JSON.stringify(r.cuerpo.error ?? "")}`);
}
const sqlLogin = await pedir("/api/auth", { method: "POST", body: JSON.stringify({ password: "' OR '1'='1" }) });
log(`  login con password=' OR '1'='1 → ${sqlLogin.status} ${JSON.stringify(sqlLogin.cuerpo.error)}`);
const sigueHabiendo = (await pedir("/api/productos")).cuerpo.length;
log(`Productos después de los ataques: ${sigueHabiendo} (la tabla sigue intacta)`);

log("\nCódigos de pedido creados:", codigos.join(", "));
log("Id del producto de prueba:", producto.cuerpo.id);
