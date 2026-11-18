// Cliente único de Prisma para toda la aplicación.
// En desarrollo Next.js recarga los módulos en cada cambio; guardamos la
// instancia en `globalThis` para no abrir una conexión nueva a MySQL cada vez.
import { PrismaClient } from "@prisma/client";

const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalParaPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = prisma;
