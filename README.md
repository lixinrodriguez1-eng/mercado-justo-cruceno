# 🛒 Mercado Justo Cruceño — Plataforma de comercio justo

Plataforma web multivendedor (nombre ficticio) donde **microemprendedores de los barrios periurbanos de Santa Cruz
de la Sierra** (Plan 3000, Villa 1ro de Mayo, Pampa de la Isla, Los Lotes…) publican su historia y sus productos y
venden **directo al cliente, sin intermediarios y con 0 % de comisión**. Café Chiquitano, la tienda de las
entregas anteriores, es ahora uno de sus seis emprendimientos.

> **Proyecto Socioformativo Integrador — Diseño Web II (UPDS).** *Plataforma Web Dinámica de Comercio Justo para la
> Inclusión Digital de Microempresarios Periurbanos en Santa Cruz.* Personas, negocios y teléfonos son ficticios.

## Funcionalidades

**Clientes (público)**

1. **Inicio** con cifras reales de la plataforma, “cómo funciona”, emprendedores, destacados y compromiso ODS 4, 8, 9 y 10.
2. **Catálogo** (`/catalogo`) filtrable por **rubro, barrio y emprendedor** + buscador (filtros en la URL, sin recargar).
3. **Página de cada emprendedor** (`/emprendedores/<slug>`): historia, barrio, WhatsApp directo y sus productos.
4. **Comercio justo visible**: cada producto muestra cuánto recibe el productor (100 %) y un botón de WhatsApp.
5. **Carrito multivendedor**: la compra se reparte en **un pedido por emprendedor**; la confirmación muestra a cada
   uno con su desglose (comisión 0, recibe el productor), **QR de pago referencial** y WhatsApp para coordinar.

**Emprendedor** (`/panel`, rol `EMPRENDEDOR`)

6. **Registro** (`/registro`) con validación y desinfección XSS; la solicitud queda **pendiente** de aprobación.
7. **Mis productos**: CRUD solo de los suyos. **Mis pedidos**: solo los suyos, con cambio de estado. **Mi perfil**.

**Administración** (`/admin`, rol `ADMIN`)

8. Aprobar / quitar aprobación / suspender emprendedores, ver pedidos de toda la plataforma y moderar productos.

## Seguridad (OWASP Top 10:2025)

| Riesgo | Medida |
| --- | --- |
| A01 Control de acceso | Roles en `proxy.ts` + verificación contra la BD en cada API; el `emprendedorId` sale de la sesión (anti-IDOR); anti-CSRF por cabecera `Origin` |
| A02 Mala configuración | CSP, HSTS, X-Frame-Options, nosniff, Referrer/Permissions-Policy, sin `X-Powered-By` |
| A04 Fallas criptográficas | Contraseñas con **bcrypt**; sesión con HMAC-SHA256 en cookie `httpOnly`, `SameSite=Lax`, `Secure` |
| A05 Inyección | Consultas parametrizadas (Prisma), lista blanca de slugs, `limpiarTexto()` contra XSS almacenado |
| A07 Autenticación | Bloqueo de 15 min tras 5 intentos fallidos (en MySQL), mismo mensaje y tiempo si el correo no existe |

## Tecnologías

| Área | Tecnología |
| --- | --- |
| Framework | **Next.js 16** (App Router, Server Components, Cache Components/PPR) + **React 19** + TypeScript |
| Estilos | **Tailwind CSS 4** (mobile-first), Fraunces + Nunito Sans |
| Base de datos | **MySQL** — local: XAMPP · nube: **TiDB Cloud Starter** (compatible con MySQL) |
| ORM | **Prisma 6** (esquema 3FN, migraciones y seed) |
| Despliegue | **Vercel** (frontend + funciones) · GitHub |
| Otros | bcryptjs, qrcode (QR referencial en SVG) |

## Modelo de datos

`usuarios` 1—1 `emprendedores` N—1 `rubros` / `barrios` · `emprendedores` 1—N `productos` ·
`compras` 1—N `pedidos` (uno por emprendedor) 1—N `detalle_pedidos` N—1 `productos`.

## Puesta en marcha local

```bash
npm install
cp .env.example .env          # ajusta DATABASE_URL, AUTH_SECRET y las contraseñas del seed
npx prisma migrate deploy     # crea las tablas en mercado_justo_db
npx prisma db seed            # 6 rubros, 8 barrios, 1 admin, 6 emprendedores, 31 productos
npm run build && npm start    # http://localhost:3000
```

Cuentas de prueba: `admin@mercadojusto.test` y `cafechiquitano@mercadojusto.test` (y los otros 5 emprendedores
`@mercadojusto.test`); las contraseñas son las de `SEED_ADMIN_PASSWORD` y `SEED_EMPRENDEDOR_PASSWORD`.

## Despliegue

1. Base MySQL en **TiDB Cloud Starter** → `DATABASE_URL` con `?sslaccept=strict`.
2. `npx prisma migrate deploy` y `npx prisma db seed` contra esa URL.
3. Proyecto en **Vercel** importado desde GitHub con las variables `DATABASE_URL` y `AUTH_SECRET`.

## Pruebas

- `informe-final/scripts/prueba-funcional.mjs`: 36 casos funcionales y de seguridad (compra multivendedor, roles,
  IDOR, CSRF, XSS, SQLi, fuerza bruta, cabeceras) contra cualquier URL.
- `informe-final/scripts/lighthouse-3g.mjs`: Lighthouse móvil (perfil estándar y 3G estricto), 3 corridas, mediana.
- `informe-final/scripts/capturas.mjs`: recorre y captura cada funcionalidad con Playwright.

Las carpetas `informe/` e `informe-auditoria/` son entregas anteriores (Café Chiquitano y su auditoría WPO/OWASP).
