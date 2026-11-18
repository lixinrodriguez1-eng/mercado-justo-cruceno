// =============================================================
// Seed (datos iniciales) - Café Chiquitano
// Crea 3 categorías y 12 productos de ejemplo.
// Ejecutar con:  npx prisma db seed
// =============================================================
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Arma la URL de Unsplash con un tamaño razonable para la web
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=75&auto=format&fit=crop`;

const categorias = [
  { nombre: "Cafés", slug: "cafes" },
  { nombre: "Postres", slug: "postres" },
  { nombre: "Salados", slug: "salados" },
];

// Precios en bolivianos (Bs)
const productos = [
  // ---------- Cafés ----------
  {
    nombre: "Espresso Chiquitano",
    descripcion: "Café de altura de los Yungas, tostado artesanal y extracción intensa con crema dorada.",
    precio: 12,
    imagen: unsplash("1514432324607-a09d9b4aefdd"),
    destacado: false,
    categoria: "cafes",
  },
  {
    nombre: "Capuchino de la Casa",
    descripcion: "Espresso doble con leche texturizada y un toque de cacao amazónico espolvoreado.",
    precio: 18,
    imagen: unsplash("1572442388796-11668a67e53d"),
    destacado: true,
    categoria: "cafes",
  },
  {
    nombre: "Latte de Canela",
    descripcion: "Leche cremosa, espresso suave y canela en rama. Ideal para la tarde cruceña.",
    precio: 20,
    imagen: unsplash("1541167760496-1628856ab772"),
    destacado: false,
    categoria: "cafes",
  },
  {
    nombre: "Café Helado",
    descripcion: "Cold brew de 12 horas servido con hielo y leche. Refrescante para el calor del oriente.",
    precio: 22,
    imagen: unsplash("1461023058943-07fcbe16d735"),
    destacado: true,
    categoria: "cafes",
  },
  // ---------- Postres ----------
  {
    nombre: "Cheesecake de Maracuyá",
    descripcion: "Base de galleta, crema de queso suave y salsa de maracuyá fresca de la región.",
    precio: 25,
    imagen: unsplash("1524351199678-941a58a3df50"),
    destacado: true,
    categoria: "postres",
  },
  {
    nombre: "Brownie con Nueces",
    descripcion: "Brownie húmedo de chocolate 70% con nueces tostadas. Pídelo tibio.",
    precio: 15,
    imagen: unsplash("1606313564200-e75d5e30476c"),
    destacado: false,
    categoria: "postres",
  },
  {
    nombre: "Torta de Chocolate",
    descripcion: "Bizcocho de cacao amazónico con ganache y crema de chocolate. Porción generosa.",
    precio: 24,
    imagen: unsplash("1578985545062-69928b1d9587"),
    destacado: false,
    categoria: "postres",
  },
  {
    nombre: "Tiramisú de la Casa",
    descripcion: "Capas de bizcocho bañado en nuestro espresso, crema de mascarpone y cacao.",
    precio: 26,
    imagen: unsplash("1571877227200-a0d98ea607e9"),
    destacado: false,
    categoria: "postres",
  },
  // ---------- Salados ----------
  {
    nombre: "Croissant de Mantequilla",
    descripcion: "Hojaldre crujiente horneado cada mañana. Puedes pedirlo relleno de jamón y queso.",
    precio: 14,
    imagen: unsplash("1555507036-ab1f4038808a"),
    destacado: true,
    categoria: "salados",
  },
  {
    nombre: "Sándwich de Pollo",
    descripcion: "Pan integral, pollo desmechado, palta, tomate y lechuga fresca.",
    precio: 28,
    imagen: unsplash("1592415499556-74fcb9f18667"),
    destacado: false,
    categoria: "salados",
  },
  {
    nombre: "Tostada de Palta y Huevo",
    descripcion: "Pan de masa madre, palta machacada, huevo pasado y semillas de sésamo.",
    precio: 25,
    imagen: unsplash("1541519227354-08fa5d50c44d"),
    destacado: false,
    categoria: "salados",
  },
  {
    nombre: "Tostado Mixto",
    descripcion: "Clásico tostado de jamón y queso menonita, dorado a la plancha.",
    precio: 18,
    imagen: unsplash("1528735602780-2552fd46c7af"),
    destacado: false,
    categoria: "salados",
  },
];

async function main() {
  console.log("🌱 Cargando datos iniciales...");

  // 1) Categorías: upsert evita duplicados si el seed se ejecuta varias veces
  for (const c of categorias) {
    await prisma.categoria.upsert({
      where: { slug: c.slug },
      update: { nombre: c.nombre },
      create: c,
    });
  }
  const mapaCategorias = new Map(
    (await prisma.categoria.findMany()).map((c) => [c.slug, c.id]),
  );

  // 2) Productos: solo se crean si la tabla está vacía, para no borrar
  //    cambios hechos desde el panel de administración.
  const existentes = await prisma.producto.count();
  if (existentes > 0) {
    console.log(`ℹ️  Ya existen ${existentes} productos; no se insertan de nuevo.`);
  } else {
    await prisma.producto.createMany({
      data: productos.map(({ categoria, ...p }) => ({
        ...p,
        categoriaId: mapaCategorias.get(categoria)!,
      })),
    });
    console.log(`✅ ${productos.length} productos creados.`);
  }

  console.log(`✅ ${categorias.length} categorías listas.`);
}

main()
  .catch((error) => {
    console.error("❌ Error en el seed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
