-- AlterTable
ALTER TABLE `flash_sale_configs` ADD COLUMN `targetType` VARCHAR(191) NOT NULL DEFAULT 'ALL';

-- CreateTable
CREATE TABLE `flash_sale_items` (
    `id` VARCHAR(191) NOT NULL,
    `configId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,

    INDEX `flash_sale_items_configId_idx`(`configId`),
    INDEX `flash_sale_items_variantId_idx`(`variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `flash_sale_items` ADD CONSTRAINT `flash_sale_items_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `flash_sale_configs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flash_sale_items` ADD CONSTRAINT `flash_sale_items_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `frozen_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
