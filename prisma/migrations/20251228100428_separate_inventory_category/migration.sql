/*
  Warnings:

  - You are about to drop the column `category_type` on the `frozen_categories` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `frozen_products` DROP FOREIGN KEY `frozen_products_categoryId_fkey`;

-- AlterTable
ALTER TABLE `frozen_categories` DROP COLUMN `category_type`,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `displayOrder` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `frozen_products` ADD COLUMN `inventoryCategoryId` VARCHAR(191) NULL,
    MODIFY `categoryId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `inventory_categories` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `type` ENUM('FINISHED_GOOD', 'RAW_MATERIAL', 'SUPPLY', 'PACKAGING') NOT NULL DEFAULT 'RAW_MATERIAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `inventory_categories_brandId_slug_key`(`brandId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `inventory_categories` ADD CONSTRAINT `inventory_categories_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `frozen_products` ADD CONSTRAINT `frozen_products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `frozen_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `frozen_products` ADD CONSTRAINT `frozen_products_inventoryCategoryId_fkey` FOREIGN KEY (`inventoryCategoryId`) REFERENCES `inventory_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
