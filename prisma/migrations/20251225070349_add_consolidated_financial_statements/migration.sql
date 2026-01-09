-- CreateTable
CREATE TABLE `consolidated_statements` (
    `id` VARCHAR(191) NOT NULL,
    `fiscalYear` INTEGER NOT NULL,
    `period` ENUM('MONTHLY', 'QUARTERLY', 'ANNUAL', 'YTD') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `totalRevenue` DECIMAL(15, 2) NOT NULL,
    `totalCOGS` DECIMAL(15, 2) NOT NULL,
    `totalExpenses` DECIMAL(15, 2) NOT NULL,
    `netProfit` DECIMAL(15, 2) NOT NULL,
    `totalAssets` DECIMAL(15, 2) NOT NULL,
    `totalLiabilities` DECIMAL(15, 2) NOT NULL,
    `totalEquity` DECIMAL(15, 2) NOT NULL,
    `operatingCashFlow` DECIMAL(15, 2) NOT NULL,
    `investingCashFlow` DECIMAL(15, 2) NOT NULL,
    `financingCashFlow` DECIMAL(15, 2) NOT NULL,
    `icEliminationAmount` DECIMAL(15, 2) NOT NULL,
    `icTransactionCount` INTEGER NOT NULL,
    `generatedBy` VARCHAR(191) NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    `plDetails` JSON NOT NULL,
    `bsDetails` JSON NOT NULL,
    `cfDetails` JSON NOT NULL,
    `icEliminations` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `consolidated_statements_fiscalYear_period_idx`(`fiscalYear`, `period`),
    UNIQUE INDEX `consolidated_statements_fiscalYear_period_key`(`fiscalYear`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consolidation_logs` (
    `id` VARCHAR(191) NOT NULL,
    `fiscalYear` INTEGER NOT NULL,
    `period` ENUM('MONTHLY', 'QUARTERLY', 'ANNUAL', 'YTD') NOT NULL,
    `status` ENUM('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `brandsProcessed` INTEGER NOT NULL,
    `icEliminated` INTEGER NOT NULL,
    `errors` JSON NULL,
    `statementId` VARCHAR(191) NULL,
    `executedBy` VARCHAR(191) NOT NULL,

    INDEX `consolidation_logs_fiscalYear_period_idx`(`fiscalYear`, `period`),
    INDEX `consolidation_logs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
