/*
  Warnings:

  - You are about to drop the column `cliente` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `codigo` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `nota` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `categoriaId` on the `productos` table. All the data in the column will be lost.
  - You are about to drop the `categorias` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `compraId` to the `pedidos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emprendedorId` to the `pedidos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `montoProductor` to the `pedidos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `pedidos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emprendedorId` to the `productos` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `productos` DROP FOREIGN KEY `productos_categoriaId_fkey`;

-- DropIndex
DROP INDEX `pedidos_codigo_key` ON `pedidos`;

-- DropIndex
DROP INDEX `pedidos_estado_idx` ON `pedidos`;

-- DropIndex
DROP INDEX `productos_categoriaId_idx` ON `productos`;

-- AlterTable
ALTER TABLE `pedidos` DROP COLUMN `cliente`,
    DROP COLUMN `codigo`,
    DROP COLUMN `nota`,
    DROP COLUMN `telefono`,
    DROP COLUMN `total`,
    ADD COLUMN `comision` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `compraId` INTEGER NOT NULL,
    ADD COLUMN `emprendedorId` INTEGER NOT NULL,
    ADD COLUMN `montoProductor` DECIMAL(10, 2) NOT NULL,
    ADD COLUMN `subtotal` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `productos` DROP COLUMN `categoriaId`,
    ADD COLUMN `emprendedorId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `categorias`;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(120) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `passwordHash` VARCHAR(100) NOT NULL,
    `rol` ENUM('ADMIN', 'EMPRENDEDOR') NOT NULL DEFAULT 'EMPRENDEDOR',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `intentosFallidos` INTEGER NOT NULL DEFAULT 0,
    `bloqueadoHasta` DATETIME(3) NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rubros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(60) NOT NULL,
    `slug` VARCHAR(60) NOT NULL,

    UNIQUE INDEX `rubros_nombre_key`(`nombre`),
    UNIQUE INDEX `rubros_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barrios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(80) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `zona` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `barrios_nombre_key`(`nombre`),
    UNIQUE INDEX `barrios_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emprendedores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(80) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `emprendimiento` VARCHAR(100) NOT NULL,
    `historia` TEXT NOT NULL,
    `whatsapp` VARCHAR(15) NOT NULL,
    `foto` VARCHAR(500) NULL,
    `aprobado` BOOLEAN NOT NULL DEFAULT false,
    `aprobadoEn` DATETIME(3) NULL,
    `rubroId` INTEGER NOT NULL,
    `barrioId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `creadoEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `emprendedores_slug_key`(`slug`),
    UNIQUE INDEX `emprendedores_usuarioId_key`(`usuarioId`),
    INDEX `emprendedores_rubroId_idx`(`rubroId`),
    INDEX `emprendedores_barrioId_idx`(`barrioId`),
    INDEX `emprendedores_aprobado_idx`(`aprobado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `compras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(30) NOT NULL,
    `cliente` VARCHAR(100) NOT NULL,
    `telefono` VARCHAR(20) NOT NULL,
    `nota` VARCHAR(255) NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `compras_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `pedidos_compraId_idx` ON `pedidos`(`compraId`);

-- CreateIndex
CREATE INDEX `pedidos_emprendedorId_estado_idx` ON `pedidos`(`emprendedorId`, `estado`);

-- CreateIndex
CREATE INDEX `productos_emprendedorId_idx` ON `productos`(`emprendedorId`);

-- AddForeignKey
ALTER TABLE `emprendedores` ADD CONSTRAINT `emprendedores_rubroId_fkey` FOREIGN KEY (`rubroId`) REFERENCES `rubros`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emprendedores` ADD CONSTRAINT `emprendedores_barrioId_fkey` FOREIGN KEY (`barrioId`) REFERENCES `barrios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emprendedores` ADD CONSTRAINT `emprendedores_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_emprendedorId_fkey` FOREIGN KEY (`emprendedorId`) REFERENCES `emprendedores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_compraId_fkey` FOREIGN KEY (`compraId`) REFERENCES `compras`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `pedidos_emprendedorId_fkey` FOREIGN KEY (`emprendedorId`) REFERENCES `emprendedores`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
