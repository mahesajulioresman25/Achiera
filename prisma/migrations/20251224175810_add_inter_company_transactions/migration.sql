-- AlterTable
ALTER TABLE `frozen_products` ADD COLUMN `inventoryType` ENUM('FINISHED_GOOD', 'RAW_MATERIAL', 'SUPPLY') NOT NULL DEFAULT 'FINISHED_GOOD';

-- AlterTable
ALTER TABLE `frozen_variants` ADD COLUMN `unit` VARCHAR(191) NOT NULL DEFAULT 'gram';

-- CreateTable
CREATE TABLE `inter_company_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `fromBrandId` VARCHAR(191) NOT NULL,
    `toBrandId` VARCHAR(191) NOT NULL,
    `type` ENUM('LOAN', 'MATERIAL_TRANSFER', 'SERVICE_FEE', 'SHARED_EXPENSE') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `description` TEXT NOT NULL,
    `referenceNo` VARCHAR(191) NULL,
    `fromJournalId` VARCHAR(191) NULL,
    `toJournalId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'ELIMINATED') NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `inter_company_transactions_fromBrandId_toBrandId_idx`(`fromBrandId`, `toBrandId`),
    INDEX `inter_company_transactions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `inter_company_transactions` ADD CONSTRAINT `inter_company_transactions_fromBrandId_fkey` FOREIGN KEY (`fromBrandId`) REFERENCES `brands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inter_company_transactions` ADD CONSTRAINT `inter_company_transactions_toBrandId_fkey` FOREIGN KEY (`toBrandId`) REFERENCES `brands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
