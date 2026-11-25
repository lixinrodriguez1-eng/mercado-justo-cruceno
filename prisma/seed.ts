// =============================================================
// Seed (datos iniciales) - Mercado Justo Cruceño
// Crea rubros, barrios periurbanos, el administrador de la plataforma y
// 6 emprendimientos FICTICIOS (incluido Café Chiquitano) con 31 productos.
// Personas, negocios y números de WhatsApp son inventados con fines académicos.
//
// Las contraseñas de las cuentas de prueba NO están en el código (el
// repositorio es público): se leen de SEED_ADMIN_PASSWORD y
// SEED_EMPRENDEDOR_PASSWORD. Si faltan, se genera una aleatoria y se muestra
// una sola vez en la consola.
//
// Ejecutar con:  npx prisma db seed
// =============================================================
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=75&auto=format&fit=crop`;

function contrasena(variable: string): string {
  const valor = process.env[variable];
  if (valor && valor.length >= 8) return valor;
  const generada = `${randomBytes(6).toString("base64url")}-7a`;
  console.log(`⚠️  ${variable} no está definida. Contraseña generada: ${generada}`);
  return generada;
}

const rubros = [
  { nombre: "Gastronomía", slug: "gastronomia" },
  { nombre: "Agroecológicos", slug: "agroecologicos" },
  { nombre: "Alimentos artesanales", slug: "alimentos-artesanales" },
  { nombre: "Artesanía", slug: "artesania" },
  { nombre: "Cosmética natural", slug: "cosmetica-natural" },
  { nombre: "Textiles y confección", slug: "textiles" },
];

// Barrios y zonas periurbanas del área metropolitana de Santa Cruz (referencial)
const barrios = [
  { nombre: "Plan 3000", slug: "plan-3000", zona: "Distrito 8 · zona este" },
  { nombre: "Villa 1ro de Mayo", slug: "villa-1ro-de-mayo", zona: "Distrito 7 · zona este" },
  { nombre: "Pampa de la Isla", slug: "pampa-de-la-isla", zona: "Distrito 6 · zona noreste" },
  { nombre: "Los Lotes", slug: "los-lotes", zona: "Zona sur" },
  { nombre: "El Bajío", slug: "el-bajio", zona: "Zona sur" },
  { nombre: "Satélite Norte", slug: "satelite-norte", zona: "Municipio de Warnes" },
  { nombre: "La Guardia", slug: "la-guardia", zona: "Municipio de La Guardia" },
  { nombre: "Cotoca", slug: "cotoca", zona: "Municipio de Cotoca" },
];

type ProductoSeed = { nombre: string; descripcion: string; precio: number; foto: string; destacado?: boolean };

const emprendedores: {
  email: string;
  nombre: string;
  emprendimiento: string;
  slug: string;
  rubro: string;
  barrio: string;
  whatsapp: string;
  foto: string;
  historia: string;
  productos: ProductoSeed[];
}[] = [
  {
    email: "cafechiquitano@mercadojusto.test",
    nombre: "Mariela Vaca Choque",
    emprendimiento: "Café Chiquitano",
    slug: "cafe-chiquitano",
    rubro: "gastronomia",
    barrio: "villa-1ro-de-mayo",
    whatsapp: "59170000001",
    foto: unsplash("1447933601403-0c6688de566e"),
    historia:
      "Mariela empezó vendiendo café pasado en termo en la feria de su barrio. Con un préstamo pequeño compró una máquina de espresso usada y hoy prepara café de altura que compra directamente a dos familias productoras de los Yungas, sin acopiadores de por medio.\n\nAntes recibía pedidos por llamadas perdidas y mensajes sueltos, y muchos se olvidaban. Ahora cada pedido llega ordenado a su panel, el cliente paga directo por QR y ella recibe el 100 % del precio.",
    productos: [
      {
        nombre: "Espresso Chiquitano",
        descripcion: "Café de altura de los Yungas, tostado artesanal y extracción intensa con crema dorada.",
        precio: 12,
        foto: "1514432324607-a09d9b4aefdd",
      },
      {
        nombre: "Capuchino de la Casa",
        descripcion: "Espresso doble con leche texturizada y un toque de cacao amazónico espolvoreado.",
        precio: 18,
        foto: "1572442388796-11668a67e53d",
        destacado: true,
      },
      {
        nombre: "Latte de Canela",
        descripcion: "Leche cremosa, espresso suave y canela en rama. Ideal para la tarde cruceña.",
        precio: 20,
        foto: "1541167760496-1628856ab772",
      },
      {
        nombre: "Café Helado",
        descripcion: "Cold brew de 12 horas servido con hielo y leche. Refrescante para el calor del oriente.",
        precio: 22,
        foto: "1461023058943-07fcbe16d735",
      },
      {
        nombre: "Café de los Yungas en grano (250 g)",
        descripcion: "Grano tostado medio, comprado directo a familias productoras. Notas a chocolate y frutos secos.",
        precio: 45,
        foto: "1447933601403-0c6688de566e",
        destacado: true,
      },
      {
        nombre: "Cheesecake de Maracuyá",
        descripcion: "Base de galleta, crema de queso suave y salsa de maracuyá fresca de la región.",
        precio: 25,
        foto: "1524351199678-941a58a3df50",
      },
      {
        nombre: "Croissant de Mantequilla",
        descripcion: "Hojaldre crujiente horneado cada mañana. Puedes pedirlo relleno de jamón y queso.",
        precio: 14,
        foto: "1555507036-ab1f4038808a",
      },
      {
        nombre: "Tostado Mixto",
        descripcion: "Clásico tostado de jamón y queso menonita, dorado a la plancha.",
        precio: 18,
        foto: "1528735602780-2552fd46c7af",
      },
    ],
  },
  {
    email: "hornodebarro@mercadojusto.test",
    nombre: "Rosa Mamani Flores",
    emprendimiento: "Horno de Barro",
    slug: "horno-de-barro",
    rubro: "gastronomia",
    barrio: "plan-3000",
    whatsapp: "59170000002",
    foto: unsplash("1509440159596-0249088772ff"),
    historia:
      "Rosa hornea desde los 15 años en el horno de barro que construyó su padre en el patio de su casa. Durante años vendió a una distribuidora que le pagaba por debajo del costo y a 30 días.\n\nCon la plataforma vende por docena a vecinos y oficinas de la ciudad, fija su propio precio y cobra el mismo día. Hoy da trabajo a dos sobrinas los fines de semana.",
    productos: [
      {
        nombre: "Panecillos caseros (docena)",
        descripcion: "Panecillos suaves horneados en horno de barro, ideales para el té de la tarde.",
        precio: 20,
        foto: "1597528662465-55ece5734101",
        destacado: true,
      },
      {
        nombre: "Pan integral de masa madre",
        descripcion: "Fermentación lenta de 24 horas, harina integral y semillas. Pieza de 700 g.",
        precio: 18,
        foto: "1509440159596-0249088772ff",
      },
      {
        nombre: "Pan casero de molde",
        descripcion: "Pan de molde sin conservantes, rebanado el mismo día de la entrega.",
        precio: 15,
        foto: "1549931319-a545dcf3bc73",
      },
      {
        nombre: "Torta de Chocolate (porción)",
        descripcion: "Bizcocho de cacao amazónico con ganache y crema de chocolate. Porción generosa.",
        precio: 24,
        foto: "1578985545062-69928b1d9587",
      },
      {
        nombre: "Brownie con Nueces",
        descripcion: "Brownie húmedo de chocolate 70 % con nueces tostadas.",
        precio: 15,
        foto: "1606313564200-e75d5e30476c",
      },
    ],
  },
  {
    email: "huertaloslotes@mercadojusto.test",
    nombre: "Juan Carlos Gutiérrez Añez",
    emprendimiento: "Huerta Familiar Los Lotes",
    slug: "huerta-familiar-los-lotes",
    rubro: "agroecologicos",
    barrio: "los-lotes",
    whatsapp: "59170000003",
    foto: unsplash("1566385101042-1a0aa0c1268c"),
    historia:
      "Juan Carlos y su familia cultivan media hectárea sin agroquímicos en las afueras de Los Lotes. Antes entregaban toda la cosecha a un rescatista que fijaba el precio en el mercado mayorista y muchas veces la verdura se perdía.\n\nAhora arman canastas semanales por pedido: cosechan solo lo que se vende, desperdician menos y ganan más por cada kilo.",
    productos: [
      {
        nombre: "Canasta de verduras agroecológicas",
        descripcion:
          "Selección semanal de 5 kg: tomate, lechuga, zanahoria, pepino y hierbas, cosechados el día de la entrega.",
        precio: 35,
        foto: "1566385101042-1a0aa0c1268c",
        destacado: true,
      },
      {
        nombre: "Huevos de campo (maple de 30)",
        descripcion: "Huevos de gallinas criadas en patio, alimentadas con maíz de la propia chacra.",
        precio: 38,
        foto: "1582722872445-44dc5f7e3c8f",
      },
      {
        nombre: "Choclo tierno (6 unidades)",
        descripcion: "Choclo dulce recién cosechado, perfecto para humintas o para hervir.",
        precio: 12,
        foto: "1551754655-cd27e38d2076",
      },
      {
        nombre: "Mango de temporada (kg)",
        descripcion: "Mangos maduros en planta, dulces y sin químicos para acelerar la maduración.",
        precio: 10,
        foto: "1553279768-865429fa0078",
      },
      {
        nombre: "Plantines de hortalizas (bandeja)",
        descripcion: "Bandeja de 24 plantines de lechuga, tomate y pimentón para tu propio huerto.",
        precio: 25,
        foto: "1466692476868-aef1dfb1e735",
      },
    ],
  },
  {
    email: "saboresdelmonte@mercadojusto.test",
    nombre: "Ana Lucía Rojas Peña",
    emprendimiento: "Sabores del Monte",
    slug: "sabores-del-monte",
    rubro: "alimentos-artesanales",
    barrio: "pampa-de-la-isla",
    whatsapp: "59170000004",
    foto: unsplash("1558642452-9d2a7deb7f62"),
    historia:
      "Ana Lucía es madre de tres hijos y transforma la fruta y la miel que le compran a pequeños productores del monte en productos envasados en su cocina, registrada como emprendimiento familiar.\n\nVendía solo en ferias de fin de semana y dependía del clima. Con la tienda en línea recibe pedidos toda la semana y cuenta la historia de cada productor con el que trabaja.",
    productos: [
      {
        nombre: "Miel de abeja (500 g)",
        descripcion: "Miel pura de apiarios familiares del monte chiquitano. Sin azúcar añadida.",
        precio: 50,
        foto: "1558642452-9d2a7deb7f62",
        destacado: true,
      },
      {
        nombre: "Jugo natural de naranja (1 L)",
        descripcion: "Exprimido el mismo día con naranjas de Yapacaní, sin agua ni azúcar.",
        precio: 15,
        foto: "1600271886742-f049cd451bba",
      },
      {
        nombre: "Refrescos naturales surtidos (3 frascos)",
        descripcion: "Mocochinchi, tamarindo y maracuyá preparados en casa con fruta fresca.",
        precio: 24,
        foto: "1622597467836-f3285f2131b8",
      },
      {
        nombre: "Chocolate artesanal 70 %",
        descripcion: "Tableta de 100 g elaborada con cacao silvestre amazónico de recolectores familiares.",
        precio: 30,
        foto: "1511381939415-e44015466834",
      },
    ],
  },
  {
    email: "barroypalma@mercadojusto.test",
    nombre: "Teodora Rivero Saucedo",
    emprendimiento: "Barro y Palma",
    slug: "barro-y-palma",
    rubro: "artesania",
    barrio: "el-bajio",
    whatsapp: "59170000005",
    foto: unsplash("1565193566173-7a0ee3dbe261"),
    historia:
      "Teodora aprendió cerámica y tejido en palma de su abuela. Su taller está en el patio de su casa y trabaja con otras cuatro artesanas del barrio.\n\nLos revendedores del centro le pagaban una fracción del precio final de cada pieza. En la plataforma publica sus piezas con su nombre y su historia, y el comprador sabe exactamente cuánto llega a las artesanas: todo.",
    productos: [
      {
        nombre: "Florero de cerámica",
        descripcion: "Pieza modelada a mano y cocida en horno a leña. Cada florero es único.",
        precio: 60,
        foto: "1565193566173-7a0ee3dbe261",
        destacado: true,
      },
      {
        nombre: "Juego de platos de cerámica (4)",
        descripcion: "Cuatro platos esmaltados en tonos tierra, aptos para uso diario.",
        precio: 120,
        foto: "1578749556568-bc2c40e68b61",
      },
      {
        nombre: "Tazas de cerámica (par)",
        descripcion: "Dos tazas de 250 ml hechas en torno, con esmalte sin plomo.",
        precio: 55,
        foto: "1610701596007-11502861dcfa",
      },
      {
        nombre: "Cartera tejida en palma",
        descripcion: "Cartera de palma tejida a mano con detalles de cuero. Trabajo de dos días.",
        precio: 140,
        foto: "1590874103328-eac38a683ce7",
      },
      {
        nombre: "Ecobolsa de tela",
        descripcion: "Bolsa reutilizable de lienzo cosida por las artesanas del taller.",
        precio: 25,
        foto: "1544816155-12df9643f363",
      },
    ],
  },
  {
    email: "aromasdeloriente@mercadojusto.test",
    nombre: "Carmen Justiniano Ortiz",
    emprendimiento: "Aromas del Oriente",
    slug: "aromas-del-oriente",
    rubro: "cosmetica-natural",
    barrio: "satelite-norte",
    whatsapp: "59170000006",
    foto: unsplash("1600857544200-b2f666a9a2ec"),
    historia:
      "Carmen hace jabones y velas con aceites vegetales, cera de abeja y plantas aromáticas de su propio jardín. Empezó como pasatiempo durante la pandemia y se convirtió en el principal ingreso de su hogar.\n\nVendía solo a conocidos por estados de WhatsApp. Con su perfil en la plataforma llega a clientes de toda la ciudad, que pueden escribirle directo antes de comprar.",
    productos: [
      {
        nombre: "Jabón de lavanda artesanal",
        descripcion: "Jabón de aceite de coco y lavanda, saponificado en frío. Barra de 100 g.",
        precio: 15,
        foto: "1600857544200-b2f666a9a2ec",
        destacado: true,
      },
      {
        nombre: "Jabones naturales surtidos (pack de 3)",
        descripcion: "Carbón activado, avena con miel y rosa mosqueta. Sin colorantes artificiales.",
        precio: 38,
        foto: "1607006344380-b6775a0824a7",
      },
      {
        nombre: "Vela aromática de soya",
        descripcion: "Vela en vaso de vidrio reutilizable, 30 horas de duración, aroma a vainilla.",
        precio: 35,
        foto: "1602874801007-bd458bb1b8b6",
      },
      {
        nombre: "Vela de cera de abeja",
        descripcion: "Cera pura de apiarios locales, mecha de algodón y aroma natural a miel.",
        precio: 30,
        foto: "1603006905003-be475563bc59",
      },
    ],
  },
];

async function main() {
  console.log("🌱 Cargando datos iniciales de Mercado Justo Cruceño...");

  // 1) Catálogos: upsert evita duplicados si el seed se ejecuta varias veces
  for (const r of rubros)
    await prisma.rubro.upsert({ where: { slug: r.slug }, update: { nombre: r.nombre }, create: r });
  for (const b of barrios) await prisma.barrio.upsert({ where: { slug: b.slug }, update: b, create: b });
  const rubroId = new Map((await prisma.rubro.findMany()).map((r) => [r.slug, r.id]));
  const barrioId = new Map((await prisma.barrio.findMany()).map((b) => [b.slug, b.id]));

  // 2) Administrador de la plataforma
  const hashAdmin = await bcrypt.hash(contrasena("SEED_ADMIN_PASSWORD"), 10);
  await prisma.usuario.upsert({
    where: { email: "admin@mercadojusto.test" },
    update: { passwordHash: hashAdmin, rol: "ADMIN", activo: true, intentosFallidos: 0, bloqueadoHasta: null },
    create: {
      email: "admin@mercadojusto.test",
      nombre: "Administración Mercado Justo",
      passwordHash: hashAdmin,
      rol: "ADMIN",
    },
  });

  // 3) Emprendedores (aprobados) con sus productos
  const hashEmprendedor = await bcrypt.hash(contrasena("SEED_EMPRENDEDOR_PASSWORD"), 10);
  let creados = 0;
  for (const { productos, email, rubro, barrio, ...e } of emprendedores) {
    const usuario = await prisma.usuario.upsert({
      where: { email },
      update: { passwordHash: hashEmprendedor, activo: true, intentosFallidos: 0, bloqueadoHasta: null },
      create: { email, nombre: e.nombre, passwordHash: hashEmprendedor, rol: "EMPRENDEDOR" },
    });
    const datos = {
      ...e,
      rubroId: rubroId.get(rubro)!,
      barrioId: barrioId.get(barrio)!,
      aprobado: true,
      aprobadoEn: new Date(),
    };
    const emprendedor = await prisma.emprendedor.upsert({
      where: { usuarioId: usuario.id },
      update: {},
      create: { ...datos, usuarioId: usuario.id },
    });

    // Productos: solo si el emprendedor aún no tiene, para no pisar cambios hechos en su panel
    if ((await prisma.producto.count({ where: { emprendedorId: emprendedor.id } })) === 0) {
      await prisma.producto.createMany({
        data: productos.map(({ foto, destacado = false, ...p }) => ({
          ...p,
          imagen: unsplash(foto),
          destacado,
          emprendedorId: emprendedor.id,
        })),
      });
      creados += productos.length;
    }
  }

  console.log(`✅ ${rubros.length} rubros, ${barrios.length} barrios, 1 administrador.`);
  console.log(`✅ ${emprendedores.length} emprendedores; ${creados} productos nuevos.`);
}

main()
  .catch((error) => {
    console.error("❌ Error en el seed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
