-- CreateTable
CREATE TABLE `anomalies` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NULL,
    `type` ENUM('HIGH_VALUE_CANCELLATION', 'TRANSFER_VELOCITY', 'UNAUTHORIZED_HOLDING_ACCESS', 'UNUSUAL_EXPENSE_SPIKE') NOT NULL,
    `severity` ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'WARNING',
    `description` TEXT NOT NULL,
    `metadata` JSON NULL,
    `status` ENUM('OPEN', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'OPEN',
    `resolvedBy` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `anomalies_brandId_idx`(`brandId`),
    INDEX `anomalies_status_idx`(`status`),
    INDEX `anomalies_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `anomalies` ADD CONSTRAINT `anomalies_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
