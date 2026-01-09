-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `note` TEXT NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `payment_method` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `settlement_batches` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NULL,
    `periodEnd` DATETIME(3) NULL,
    `totalAmount` DECIMAL(15, 2) NOT NULL,
    `totalFees` DECIMAL(15, 2) NOT NULL,
    `netAmount` DECIMAL(15, 2) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `uploadedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `settlement_batches_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settlement_items` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `invoiceNo` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `fees` DECIMAL(15, 2) NOT NULL,
    `netAmount` DECIMAL(15, 2) NOT NULL,
    `payoutDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'UNMATCHED',
    `discrepancyAmount` DECIMAL(15, 2) NULL,
    `notes` TEXT NULL,

    INDEX `settlement_items_batchId_idx`(`batchId`),
    INDEX `settlement_items_invoiceNo_idx`(`invoiceNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `settlement_batches` ADD CONSTRAINT `settlement_batches_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settlement_items` ADD CONSTRAINT `settlement_items_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `settlement_batches`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
