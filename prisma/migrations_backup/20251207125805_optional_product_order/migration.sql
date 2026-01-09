-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_productId_fkey`;

-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_variantId_fkey`;

-- AlterTable
ALTER TABLE `orders` MODIFY `productId` VARCHAR(191) NULL,
    MODIFY `variantId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `mockup_product_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `mockup_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
