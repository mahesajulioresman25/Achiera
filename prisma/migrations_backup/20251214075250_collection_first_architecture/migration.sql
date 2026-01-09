/*
  Warnings:

  - You are about to drop the column `productId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `merch_collections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mockup_color_variants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mockup_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mockup_product_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `mockup_variants` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `merch_collections` DROP FOREIGN KEY `merch_collections_brandId_fkey`;

-- DropForeignKey
ALTER TABLE `mockup_color_variants` DROP FOREIGN KEY `mockup_color_variants_templateId_fkey`;

-- DropForeignKey
ALTER TABLE `mockup_configs` DROP FOREIGN KEY `mockup_configs_brandId_fkey`;

-- DropForeignKey
ALTER TABLE `mockup_product_templates` DROP FOREIGN KEY `mockup_product_templates_brandId_fkey`;

-- DropForeignKey
ALTER TABLE `mockup_variants` DROP FOREIGN KEY `mockup_variants_templateId_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_productId_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_variantId_fkey`;

-- AlterTable
ALTER TABLE `brands` ADD COLUMN `paymentSettings` JSON NULL;

-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `variantId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `order_status_logs` MODIFY `status` ENUM('PENDING', 'WAITING_PAYMENT', 'PAYMENT_VERIFIED', 'IN_PRODUCTION', 'WAITING_FINAL_PAYMENT', 'QUALITY_CHECK', 'PACKING', 'SHIPPED', 'COMPLETED', 'CANCELLED') NOT NULL;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `productId`,
    DROP COLUMN `variantId`,
    MODIFY `status` ENUM('PENDING', 'WAITING_PAYMENT', 'PAYMENT_VERIFIED', 'IN_PRODUCTION', 'WAITING_FINAL_PAYMENT', 'QUALITY_CHECK', 'PACKING', 'SHIPPED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'WAITING_PAYMENT';

-- DropTable
DROP TABLE `merch_collections`;

-- DropTable
DROP TABLE `mockup_color_variants`;

-- DropTable
DROP TABLE `mockup_configs`;

-- DropTable
DROP TABLE `mockup_product_templates`;

-- DropTable
DROP TABLE `mockup_variants`;

-- CreateTable
CREATE TABLE `collections` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `coverImage` TEXT NULL,
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `heroTitle` TEXT NOT NULL,
    `heroSubtitle` TEXT NOT NULL,
    `highlights` JSON NULL,
    `whatsInside` JSON NULL,
    `designOptions` JSON NULL,
    `materialPoints` JSON NULL,
    `useCases` JSON NULL,
    `packagingOptions` JSON NULL,
    `faq` JSON NULL,
    `galleryImages` JSON NULL,
    `metaTitle` TEXT NULL,
    `metaDescription` TEXT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `collections_brandId_slug_key`(`brandId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` VARCHAR(191) NOT NULL,
    `collectionId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `productType` VARCHAR(191) NOT NULL,
    `baseImage` TEXT NULL,
    `description` TEXT NULL,
    `isCustomizable` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `metaTitle` TEXT NULL,
    `metaDescription` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_slug_key`(`slug`),
    UNIQUE INDEX `products_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `attributes` JSON NOT NULL,
    `basePrice` DECIMAL(12, 2) NOT NULL,
    `compareAtPrice` DECIMAL(12, 2) NULL,
    `stockStatus` VARCHAR(191) NOT NULL DEFAULT 'in-stock',
    `stockQuantity` INTEGER NULL,
    `lowStockAlert` INTEGER NULL,
    `productionTime` VARCHAR(191) NULL,
    `weight` DECIMAL(10, 2) NULL,
    `dimensions` JSON NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_variants_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mockup_templates` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NULL,
    `canvasWidth` INTEGER NOT NULL,
    `canvasHeight` INTEGER NOT NULL,
    `aspectRatio` VARCHAR(191) NULL,
    `printAreaX` DOUBLE NOT NULL,
    `printAreaY` DOUBLE NOT NULL,
    `printAreaWidth` DOUBLE NOT NULL,
    `printAreaHeight` DOUBLE NOT NULL,
    `safeAreaX` DOUBLE NOT NULL,
    `safeAreaY` DOUBLE NOT NULL,
    `safeAreaWidth` DOUBLE NOT NULL,
    `safeAreaHeight` DOUBLE NOT NULL,
    `hasBackView` BOOLEAN NOT NULL DEFAULT false,
    `backPrintAreaX` DOUBLE NULL,
    `backPrintAreaY` DOUBLE NULL,
    `backPrintAreaWidth` DOUBLE NULL,
    `backPrintAreaHeight` DOUBLE NULL,
    `backSafeAreaX` DOUBLE NULL,
    `backSafeAreaY` DOUBLE NULL,
    `backSafeAreaWidth` DOUBLE NULL,
    `backSafeAreaHeight` DOUBLE NULL,
    `frontMockupImage` TEXT NULL,
    `backMockupImage` TEXT NULL,
    `tintMaskUrl` TEXT NULL,
    `maxColors` INTEGER NULL,
    `allowedFormats` JSON NULL,
    `minResolution` INTEGER NULL,
    `maxFileSize` INTEGER NULL,
    `layersConfig` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `price_components` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('FIXED', 'PERCENT', 'PER_UNIT', 'PER_METER', 'MULTIPLIER') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `price_components_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `price_rules` (
    `id` VARCHAR(191) NOT NULL,
    `componentId` VARCHAR(191) NOT NULL,
    `scope` ENUM('GLOBAL', 'BRAND', 'PRODUCT', 'VARIANT') NOT NULL,
    `scopeId` VARCHAR(191) NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'IDR',
    `amount` DECIMAL(12, 2) NOT NULL,
    `minQty` INTEGER NULL,
    `maxQty` INTEGER NULL,
    `minOrderMeter` DECIMAL(10, 2) NULL,
    `metadata` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `price_rules_scope_scopeId_isActive_idx`(`scope`, `scopeId`, `isActive`),
    INDEX `price_rules_componentId_isActive_idx`(`componentId`, `isActive`),
    INDEX `price_rules_startAt_endAt_idx`(`startAt`, `endAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `price_history` (
    `id` VARCHAR(191) NOT NULL,
    `ruleId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `performedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `price_history_ruleId_createdAt_idx`(`ruleId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `currencies` (
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `collections` ADD CONSTRAINT `collections_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_collectionId_fkey` FOREIGN KEY (`collectionId`) REFERENCES `collections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mockup_templates` ADD CONSTRAINT `mockup_templates_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mockup_templates` ADD CONSTRAINT `mockup_templates_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_rules` ADD CONSTRAINT `price_rules_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `price_components`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `product_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
