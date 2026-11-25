// =============================================================
// Pruebas funcionales y de seguridad de Mercado Justo Cruceño (caja negra,
// solo HTTP: sirven igual para localhost y para la URL pública).
//
// Uso:
//   BASE=http://localhost:3200 ADMIN_PASS=... EMP_PASS=... node prueba-funcional.mjs [salida.json]
//
// Cubre: compra multivendedor, comercio justo (comisión 0 %), roles
// ADMIN/EMPRENDEDOR, aislamiento entre emprendedores (IDOR), registro y
// aprobación, XSS almacenado, inyección SQL, CSRF (Origin), fuerza bruta y
// cabeceras de seguridad.
// =============================================================
import { writeFileSync } from "node:fs";

const BASE = (process.env.BASE ?? "http://localhost:3200").replace(/\/$/, "");
const ADMIN = { email: "admin@mercadojusto.test", password: process.env.ADMIN_PASS };
const CAFE = { email: "cafechiquitano@mercadojusto.test", password: process.env.EMP_PASS };
const HORNO = { email: "hornodebarro@mercadojusto.test", password: process.env.EMP_PASS };
const ORIGEN = new URL(BASE).origin;

const resultados = [];
let fallos = 0;
function caso(id, descripcion, ok, detalle = "") {
  resultados.push({ id, descripcion, resultado: ok ? "PASA" : "FALLA", detalle });
  if (!ok) fallos++;
  console.log(`${ok ? "✔" : "✘"} ${id} ${descripcion}${detalle ? ` → ${detalle}` : ""}`);
}

async function pedir(ruta, { metodo = "GET", cuerpo, cookie, origen = ORIGEN } = {}) {
  const r = await fetch(BASE + ruta, {
    method: metodo,
    redirect: "manual",
    headers: {
      ...(cuerpo !== undefined && { "Content-Type": "application/json" }),
      ...(origen && metodo !== "GET" && { Origin: origen }),
      ...(cookie && { Cookie: cookie }),
    },
    body: cuerpo === undefined ? undefined : typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo),
  });
  const texto = await r.text();
  let json;
  try {
    json = JSON.parse(texto);
  } catch {
    /* HTML */
  }
  return { status: r.status, json, texto, headers: r.headers };
}

async function login(cred) {
  const r = await pedir("/api/auth", { metodo: "POST", cuerpo: cred });
  const cookie = r.headers.get("set-cookie")?.split(";")[0];
  return { ...r, cookie };
}

const inicio = Date.now();

// ---------- 1. Catálogo público ----------
const productos = (await pedir("/api/productos")).json ?? [];
const emprendedores = (await pedir("/api/emprendedores")).json ?? [];
caso("F01", "Catálogo público lista productos de varios emprendedores", productos.length >= 25 && new Set(productos.map((p) => p.emprendedorId)).size >= 6, `${productos.length} productos, ${emprendedores.length} emprendedores`);
const filtroBarrio = (await pedir("/api/productos?barrio=plan-3000")).json ?? [];
caso("F02", "Filtro por barrio (Plan 3000)", filtroBarrio.length > 0 && filtroBarrio.every((p) => p.emprendedor.barrio.slug === "plan-3000"), `${filtroBarrio.length} productos`);
const filtroRubro = (await pedir("/api/productos?rubro=artesania")).json ?? [];
caso("F03", "Filtro por rubro (Artesanía)", filtroRubro.length > 0 && filtroRubro.every((p) => p.emprendedor.rubro.slug === "artesania"), `${filtroRubro.length} productos`);
const filtroEmp = (await pedir("/api/productos?emprendedor=cafe-chiquitano")).json ?? [];
caso("F04", "Filtro por emprendedor (Café Chiquitano)", filtroEmp.length > 0 && filtroEmp.every((p) => p.emprendedor.slug === "cafe-chiquitano"), `${filtroEmp.length} productos`);
const paginaEmp = await pedir("/emprendedores/cafe-chiquitano");
caso("F05", "Página pública del emprendedor con su historia", paginaEmp.status === 200 && paginaEmp.texto.includes("Nuestra historia") && paginaEmp.texto.includes("wa.me/"), `HTTP ${paginaEmp.status}`);

// ---------- 2. Compra multivendedor ----------
const pCafe = productos.find((p) => p.emprendedor.slug === "cafe-chiquitano");
const pHorno = productos.find((p) => p.emprendedor.slug === "horno-de-barro");
const compraR = await pedir("/api/pedidos", {
  metodo: "POST",
  cuerpo: {
    cliente: "Prueba Automatizada",
    telefono: "71234567",
    nota: "Pedido de prueba del informe",
    items: [
      { productoId: pCafe.id, cantidad: 2 },
      { productoId: pHorno.id, cantidad: 1 },
    ],
    // Intento de manipular el precio desde el cliente: debe ignorarse
    total: 1,
  },
});
const compra = compraR.json;
const totalEsperado = pCafe.precio * 2 + pHorno.precio;
caso("F06", "Compra con 2 emprendedores se reparte en 2 pedidos", compraR.status === 201 && compra?.pedidos?.length === 2, `HTTP ${compraR.status}, código ${compra?.codigo}`);
caso("F07", "El servidor recalcula el total (ignora el precio enviado)", Math.abs((compra?.total ?? 0) - totalEsperado) < 0.001, `total ${compra?.total} = esperado ${totalEsperado}`);
caso("F08", "Comercio justo: comisión 0 y productor recibe el 100 %", compra?.pedidos?.every((p) => p.comision === 0 && p.montoProductor === p.subtotal), compra?.pedidos?.map((p) => `${p.emprendedor.emprendimiento}: Bs ${p.montoProductor}`).join("; "));
const confirmacion = await pedir(`/pedido/${compra?.codigo}`);
caso("F09", "Página de confirmación con QR referencial y WhatsApp por emprendedor", confirmacion.status === 200 && (confirmacion.texto.match(/data:image\/svg\+xml;base64/g) ?? []).length >= 2 && confirmacion.texto.includes("wa.me/"), `HTTP ${confirmacion.status}`);

// ---------- 3. Roles y aislamiento ----------
const admin = await login(ADMIN);
caso("F10", "Login del ADMIN (bcrypt) redirige a /admin", admin.status === 200 && admin.json?.destino === "/admin" && !!admin.cookie);
const cafe = await login(CAFE);
caso("F11", "Login del EMPRENDEDOR redirige a /panel", cafe.status === 200 && cafe.json?.destino === "/panel" && !!cafe.cookie);
const horno = await login(HORNO);

const pedidosCafe = (await pedir("/api/panel/pedidos", { cookie: cafe.cookie })).json ?? [];
caso("F12", "El emprendedor ve SOLO sus pedidos", pedidosCafe.length > 0 && pedidosCafe.every((p) => p.emprendedor.slug === "cafe-chiquitano"), `${pedidosCafe.length} pedidos, todos de Café Chiquitano`);
const pedidoCafe = pedidosCafe.find((p) => p.codigoCompra === compra?.codigo);
const cambio = await pedir(`/api/panel/pedidos/${pedidoCafe?.id}`, { metodo: "PATCH", cuerpo: { estado: "PREPARANDO" }, cookie: cafe.cookie });
caso("F13", "El emprendedor cambia el estado de su pedido", cambio.status === 200 && cambio.json?.estado === "PREPARANDO");
const pedidosAdmin = (await pedir("/api/admin/pedidos", { cookie: admin.cookie })).json ?? [];
caso("F14", "El ADMIN ve los pedidos de todos los emprendedores", new Set(pedidosAdmin.map((p) => p.emprendedor.slug)).size >= 2, `${pedidosAdmin.length} pedidos`);

const nuevo = await pedir("/api/panel/productos", { metodo: "POST", cookie: cafe.cookie, cuerpo: { nombre: "Producto de prueba", descripcion: "Creado por la prueba automatizada.", precio: 9.5, imagen: "/icon.svg", emprendedorId: 999 } });
caso("F15", "El emprendedor crea un producto (el dueño sale de la sesión, no del cuerpo)", nuevo.status === 201 && nuevo.json?.emprendedor?.slug === "cafe-chiquitano", `HTTP ${nuevo.status}`);
const idor1 = await pedir(`/api/panel/productos/${nuevo.json?.id}`, { metodo: "PATCH", cookie: horno.cookie, cuerpo: { precio: 1 } });
caso("S01", "IDOR: otro emprendedor NO puede editar ese producto", idor1.status === 404, `HTTP ${idor1.status}`);
const idor2 = await pedir(`/api/panel/pedidos/${pedidoCafe?.id}`, { metodo: "PATCH", cookie: horno.cookie, cuerpo: { estado: "ENTREGADO" } });
caso("S02", "IDOR: otro emprendedor NO puede cambiar un pedido ajeno", idor2.status === 404, `HTTP ${idor2.status}`);
const borrar = await pedir(`/api/panel/productos/${nuevo.json?.id}`, { metodo: "DELETE", cookie: cafe.cookie });
caso("F16", "El emprendedor elimina su producto", borrar.status === 204);
const escalada = await pedir("/api/admin/emprendedores", { cookie: cafe.cookie });
caso("S03", "Un EMPRENDEDOR no accede a la API del ADMIN", escalada.status === 403, `HTTP ${escalada.status}`);
const paginaAdmin = await pedir("/admin", { cookie: cafe.cookie });
caso("S04", "Un EMPRENDEDOR que abre /admin es enviado a su panel", paginaAdmin.status === 307 && paginaAdmin.headers.get("location")?.endsWith("/panel"), `HTTP ${paginaAdmin.status} → ${paginaAdmin.headers.get("location")}`);
const [idT, , expT, firmaT] = decodeURIComponent(cafe.cookie.split("=")[1]).split(".");
const tokenFalso = `mjc_sesion=${idT}.ADMIN.${expT}.${firmaT}`;
const falsificado = await pedir("/api/admin/emprendedores", { cookie: tokenFalso });
caso("S05", "Cookie manipulada (rol cambiado a ADMIN) es rechazada por la firma HMAC", falsificado.status === 401, `HTTP ${falsificado.status}`);
const sinSesion = await pedir("/api/panel/productos");
caso("S06", "Sin sesión, la API del panel responde 401", sinSesion.status === 401);

// ---------- 4. Registro, XSS y aprobación ----------
const sufijo = Date.now().toString(36);
const registro = await pedir("/api/registro", {
  metodo: "POST",
  cuerpo: {
    email: `prueba-${sufijo}@mercadojusto.test`,
    password: "Prueba2026x",
    nombre: "Lucía Prueba Añez",
    emprendimiento: `Tejidos <script>alert('xss')</script> ${sufijo}`,
    historia: `Historia de prueba <img src=x onerror=alert(1)> con suficiente texto para superar el mínimo de cuarenta caracteres. <a href="javascript:alert(2)">clic</a>`,
    whatsapp: "71234567",
    foto: "javascript:alert(3)",
    rubroId: 1,
    barrioId: 1,
    acepta: true,
  },
});
caso("S07", "Registro con URL de foto javascript: es rechazado", registro.status === 422 && !!registro.json?.errores?.foto, `HTTP ${registro.status}: ${registro.json?.errores?.foto ?? ""}`);
const registro2 = await pedir("/api/registro", {
  metodo: "POST",
  cuerpo: {
    email: `prueba-${sufijo}@mercadojusto.test`,
    password: "Prueba2026x",
    nombre: "Lucía Prueba Añez",
    emprendimiento: `Tejidos <script>alert('xss')</script> ${sufijo}`,
    historia: `Historia de prueba <img src=x onerror=alert(1)> con suficiente texto para superar el mínimo de cuarenta caracteres. <a href="javascript:alert(2)">clic</a>`,
    whatsapp: "71234567",
    rubroId: 1,
    barrioId: 1,
    acepta: true,
  },
});
const nuevoEmp = await login({ email: `prueba-${sufijo}@mercadojusto.test`, password: "Prueba2026x" });
const perfil = (await pedir("/api/panel/perfil", { cookie: nuevoEmp.cookie })).json;
caso("F17", "Registro de emprendedor crea la cuenta como PENDIENTE", registro2.status === 201 && perfil?.aprobado === false, `HTTP ${registro2.status}`);
const textoGuardado = `${perfil?.emprendimiento} ${perfil?.historia}`;
caso("S08", "XSS almacenado: el servidor guarda solo texto plano", !/[<>]|script|onerror|javascript:/i.test(textoGuardado), `guardado: "${perfil?.emprendimiento}"`);
const visibleAntes = (await pedir("/api/emprendedores")).json?.some((e) => e.id === perfil?.id);
caso("F18", "Un emprendedor pendiente NO aparece en la tienda", visibleAntes === false);
const aprobar = await pedir(`/api/admin/emprendedores/${perfil?.id}`, { metodo: "PATCH", cookie: admin.cookie, cuerpo: { aprobado: true } });
const visibleDespues = (await pedir("/api/emprendedores")).json?.some((e) => e.id === perfil?.id);
caso("F19", "El ADMIN aprueba la solicitud y el emprendedor aparece en la tienda", aprobar.status === 200 && visibleDespues === true);
const suspender = await pedir(`/api/admin/emprendedores/${perfil?.id}`, { metodo: "PATCH", cookie: admin.cookie, cuerpo: { activo: false } });
const sesionSuspendida = await pedir("/api/panel/perfil", { cookie: nuevoEmp.cookie });
caso("S09", "Al suspender la cuenta, su sesión abierta deja de servir al instante", suspender.status === 200 && sesionSuspendida.status === 401, `HTTP ${sesionSuspendida.status}`);
// Limpieza: la cuenta de prueba queda suspendida y sin aprobar (no se ve en la tienda)
await pedir(`/api/admin/emprendedores/${perfil?.id}`, { metodo: "PATCH", cookie: admin.cookie, cuerpo: { aprobado: false } });

// ---------- 5. Inyección SQL, CSRF, fuerza bruta ----------
const sqli1 = await pedir(`/api/productos?q=${encodeURIComponent("' OR '1'='1")}`);
caso("S10", "SQLi en el buscador (' OR '1'='1) no devuelve todo el catálogo", sqli1.status === 200 && (sqli1.json?.length ?? 99) === 0, `${sqli1.json?.length} resultados`);
const sqli2 = await pedir(`/api/productos?barrio=${encodeURIComponent("x' UNION SELECT email,passwordHash FROM usuarios -- ")}`);
caso("S11", "SQLi con UNION en el filtro se descarta (lista blanca de slug)", sqli2.status === 200 && !sqli2.texto.includes("$2b$"), `HTTP ${sqli2.status}`);
const sqli3 = await pedir("/api/auth", { metodo: "POST", cuerpo: { email: "admin@mercadojusto.test' -- ", password: "x' OR '1'='1" } });
caso("S12", "SQLi en el inicio de sesión es rechazada", sqli3.status === 401, `HTTP ${sqli3.status}`);
const csrf = await pedir("/api/pedidos", { metodo: "POST", origen: "https://sitio-atacante.example", cuerpo: { cliente: "CSRF", telefono: "71234567", items: [{ productoId: pCafe.id, cantidad: 1 }] } });
caso("S13", "CSRF: POST desde otro origen es rechazado (403)", csrf.status === 403, `HTTP ${csrf.status}`);
const csrf2 = await pedir(`/api/admin/emprendedores/${perfil?.id}`, { metodo: "PATCH", origen: "https://sitio-atacante.example", cookie: admin.cookie, cuerpo: { aprobado: true } });
caso("S14", "CSRF: aun con la cookie del ADMIN, otro origen no puede aprobar", csrf2.status === 403, `HTTP ${csrf2.status}`);
const desconocido = await pedir("/api/auth", { metodo: "POST", cuerpo: { email: "nadie@mercadojusto.test", password: "x" } });
const incorrecta = await pedir("/api/auth", { metodo: "POST", cuerpo: { email: HORNO.email, password: "incorrecta" } });
caso("S15", "Mismo mensaje si el correo no existe (sin enumeración de usuarios)", desconocido.json?.error === incorrecta.json?.error, desconocido.json?.error);
let bloqueo;
for (let i = 0; i < 5; i++) bloqueo = await pedir("/api/auth", { metodo: "POST", cuerpo: { email: `prueba-${sufijo}@mercadojusto.test`, password: `mala-${i}` } });
const tras = await pedir("/api/auth", { metodo: "POST", cuerpo: { email: `prueba-${sufijo}@mercadojusto.test`, password: "Prueba2026x" } });
caso("S16", "Fuerza bruta: 5 intentos fallidos bloquean la cuenta 15 min", bloqueo.status === 429 && tras.status === 429, `intento 5: HTTP ${bloqueo.status}; luego, con la contraseña correcta: HTTP ${tras.status}`);

// ---------- 6. Cabeceras ----------
const h = (await fetch(BASE + "/")).headers;
const requeridas = ["content-security-policy", "x-frame-options", "x-content-type-options", "referrer-policy", "permissions-policy", "strict-transport-security"];
const faltan = requeridas.filter((c) => !h.get(c));
caso("S17", "Cabeceras de seguridad presentes", faltan.length === 0 && !h.get("x-powered-by"), faltan.length ? `faltan: ${faltan.join(", ")}` : "6/6, sin X-Powered-By");

const resumen = { base: BASE, fecha: new Date().toISOString(), segundos: Math.round((Date.now() - inicio) / 1000), total: resultados.length, pasan: resultados.length - fallos, fallan: fallos, compraDePrueba: compra?.codigo, resultados };
console.log(`\n${resumen.pasan}/${resumen.total} casos pasan (${resumen.segundos} s) contra ${BASE}`);
if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(resumen, null, 2));
process.exit(fallos ? 1 : 0);
