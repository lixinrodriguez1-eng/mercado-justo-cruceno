# ☕ Café Chiquitano — Tienda en línea

Aplicación web ágil y responsiva para **Café Chiquitano**, una cafetería local (nombre ficticio) de
Santa Cruz de la Sierra, Bolivia. Permite a los clientes ver el menú, armar un carrito y hacer su
pedido en línea para recogerlo sin filas; el personal gestiona productos y pedidos desde un panel
de administración.

> Trabajo práctico de **Diseño Web 2 — UPDS**: *“Maquetación e Implementación de la Interfaz con un
> Framework JS Ágil”*.

## Aporte a los ODS

| ODS | Cómo aporta el proyecto |
| --- | --- |
| **ODS 8 — Trabajo decente y crecimiento económico** | Un negocio local vende en línea y amplía su alcance sin intermediarios; el pedido anticipado ordena el trabajo de baristas y cocina. |
| **ODS 9 — Industria, innovación e infraestructura** | Digitaliza el proceso de pedidos de una pyme con tecnologías web modernas, base de datos real y un panel de gestión. |

## Funcionalidades

**Modo cliente**

1. **Inicio**: hero, productos destacados (leídos de MySQL), compromiso ODS, horarios con indicador “Abierto ahora / Cerrado” y ubicación.
2. **Menú** (`/menu`): filtro por categoría y buscador reactivos, sin recargar la página.
3. **Carrito** (`/carrito`): se guarda en el navegador (`localStorage`); el **formulario de pedido** lo registra en **MySQL**.
4. **Confirmación** (`/pedido/<código>`): número de pedido, detalle, total, estado y enlace a WhatsApp.

**Modo administrador** (`/admin`, protegido con contraseña)

5. **CRUD de productos**: crear, editar, eliminar y marcar disponible/destacado.
6. **Pedidos** (`/admin/pedidos`): lista con filtro y cambio de estado `PENDIENTE → PREPARANDO → ENTREGADO`.

## Tecnologías

| Área | Tecnología |
| --- | --- |
| Framework | **Next.js 16** (App Router, Server Components, Cache Components) + **React 19** |
| Lenguaje | **TypeScript** |
| Estilos | **Tailwind CSS 4** (mobile-first) · Google Fonts: *Fraunces* (títulos) y *Nunito Sans* (texto) |
| Base de datos | **MySQL / MariaDB** (XAMPP), base de datos `cafeteria_db` |
| ORM | **Prisma 6** (esquema, migraciones y seed) |
| Imágenes | `next/image` (AVIF/WebP) con fotos de Unsplash |

## Estructura del proyecto

```
app/
├── (tienda)/            # Modo cliente: inicio, menú, carrito, confirmación
├── admin/               # Modo administrador: login, productos, pedidos
├── api/                 # Rutas API (validación + manejo de errores)
│   ├── productos/       # GET públicos
│   ├── categorias/
│   ├── pedidos/         # POST: guarda el pedido en MySQL
│   ├── auth/            # login / logout del administrador
│   └── admin/           # CRUD productos y estados de pedidos (requieren sesión)
components/              # Componentes reutilizables (Navbar, TarjetaProducto, carrito, admin…)
lib/                     # Prisma, acceso a datos, validación, autenticación, utilidades
prisma/
├── schema.prisma        # Modelos: Categoria, Producto, Pedido, DetallePedido
├── migrations/          # Migraciones SQL
└── seed.ts              # 3 categorías y 12 productos de ejemplo
proxy.ts                 # Protege las páginas /admin (antes llamado "middleware")
```

## Modelo de datos

- **Categoria** (`id`, `nombre`, `slug`) 1 ── N **Producto**
- **Producto** (`nombre`, `descripcion`, `precio`, `imagen`, `disponible`, `destacado`, `categoriaId`)
- **Pedido** (`codigo`, `cliente`, `telefono`, `nota`, `total`, `estado`, `fecha`) 1 ── N **DetallePedido**
- **DetallePedido** (`pedidoId`, `productoId`, `nombreProducto`, `precioUnitario`, `cantidad`, `subtotal`)

El total del pedido se calcula **en el servidor** con los precios de la base de datos (no se confía
en los precios enviados por el navegador) y se guarda dentro de una transacción.

## Cómo ejecutarlo

### Requisitos

- [Node.js](https://nodejs.org) 20 o superior
- [XAMPP](https://www.apachefriends.org) (MySQL/MariaDB)

### Pasos

1. **Iniciar MySQL**: abrir el panel de XAMPP y pulsar **Start** en *MySQL*.
2. **Crear la base de datos** `cafeteria_db` en phpMyAdmin (<http://localhost/phpmyadmin>)
   con cotejamiento `utf8mb4_unicode_ci`. *(Opcional: Prisma la crea si no existe.)*
3. **Configurar variables de entorno**: copiar `.env.example` como `.env` y ajustar los valores.

   ```bash
   copy .env.example .env      # Windows (cmd)
   ```

   | Variable | Descripción |
   | --- | --- |
   | `DATABASE_URL` | `mysql://root:@localhost:3306/cafeteria_db` (XAMPP: usuario `root`, sin contraseña) |
   | `ADMIN_PASSWORD` | Contraseña para entrar a `/admin` |
   | `AUTH_SECRET` | Cadena aleatoria de 16+ caracteres para firmar la sesión |

4. **Instalar dependencias** (también genera el cliente de Prisma):

   ```bash
   npm install
   ```

5. **Crear las tablas** con las migraciones:

   ```bash
   npx prisma migrate dev
   ```

6. **Cargar los datos de ejemplo** (3 categorías y 12 productos):

   ```bash
   npx prisma db seed
   ```

7. **Iniciar el servidor de desarrollo**:

   ```bash
   npm run dev
   ```

   - Tienda: <http://localhost:3000>
   - Panel de administración: <http://localhost:3000/admin>

### Otros comandos

| Comando | Uso |
| --- | --- |
| `npm run build` y `npm start` | Versión de producción (usar esta para medir con Lighthouse) |
| `npm run lint` | Revisión de código con ESLint |
| `npm run db:studio` | Abre Prisma Studio para ver las tablas |

## Rutas API

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/categorias` | Lista de categorías |
| GET | `/api/productos?categoria=&q=&destacados=1` | Productos disponibles (con filtros) |
| GET | `/api/productos/:id` | Detalle de un producto |
| POST | `/api/pedidos` | Registra un pedido |
| POST / DELETE | `/api/auth` | Inicia / cierra la sesión del administrador |
| GET / POST | `/api/admin/productos` | Lista todos / crea un producto 🔒 |
| PUT / PATCH / DELETE | `/api/admin/productos/:id` | Edita, cambia disponibilidad o elimina 🔒 |
| GET | `/api/admin/pedidos?estado=` | Lista de pedidos 🔒 |
| PATCH | `/api/admin/pedidos/:id` | Cambia el estado de un pedido 🔒 |

Las rutas validan los datos y responden con códigos claros: `400` (JSON mal formado),
`401` (sin sesión), `404` (no existe), `409` (producto no disponible), `422` (datos inválidos con
detalle por campo) y `503` (MySQL apagado).

## Diseño, accesibilidad y rendimiento

- Paleta cálida café/crema con acento terracota; tarjetas con sombra suave.
- Navbar *sticky* con menú hamburguesa en móvil.
- Transiciones de 200 ms y soporte de `prefers-reduced-motion`.
- Textos alternativos en imágenes, `label` en todos los campos, foco visible, enlace “Saltar al contenido” y contraste AA.
- Imágenes optimizadas con `next/image`, fuentes con `next/font` y pre-renderizado parcial para una carga rápida en celulares.

## Integrantes

- Lizeth Adela Rodríguez Padilla

**Docente:** Ing. Pablo Moscoso Zeballos · **Materia:** Diseño Web II · **Universidad Privada Domingo Savio (UPDS)** · 2026

El informe (APA 7), la presentación y las capturas de pantalla están en la carpeta [`informe/`](informe/).
