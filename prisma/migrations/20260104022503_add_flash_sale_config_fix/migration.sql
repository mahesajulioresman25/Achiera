-- CreateTable
CREATE TABLE `flash_sale_configs` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'Flash Sale',
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `discountPercentage` DECIMAL(5, 2) NOT NULL,
    `minPurchaseAmount` DECIMAL(12, 2) NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `activeDays` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `flash_sale_configs_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `flash_sale_configs` ADD CONSTRAINT `flash_sale_configs_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
