-- CreateTable
CREATE TABLE `capital_allocations` (
    `id` VARCHAR(191) NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `validUntil` DATETIME(3) NOT NULL,
    `totalCashAvailable` DECIMAL(15, 2) NOT NULL,
    `brandCashPositions` JSON NOT NULL,
    `recommendations` JSON NOT NULL,
    `overallScore` DECIMAL(5, 2) NOT NULL,
    `riskLevel` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `executedBy` VARCHAR(191) NULL,
    `executedAt` DATETIME(3) NULL,
    `aiModelVersion` VARCHAR(191) NOT NULL DEFAULT 'v1.0',
    `confidence` DECIMAL(5, 2) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `capital_allocations_status_generatedAt_idx`(`status`, `generatedAt`),
    INDEX `capital_allocations_riskLevel_idx`(`riskLevel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `allocation_scenarios` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `allocations` JSON NOT NULL,
    `assumptions` JSON NOT NULL,
    `predictedROI` DECIMAL(5, 2) NOT NULL,
    `predictedRevenue` DECIMAL(15, 2) NOT NULL,
    `predictedProfit` DECIMAL(15, 2) NOT NULL,
    `riskScore` DECIMAL(5, 2) NOT NULL,
    `riskFactors` JSON NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `allocation_scenarios_createdBy_idx`(`createdBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
