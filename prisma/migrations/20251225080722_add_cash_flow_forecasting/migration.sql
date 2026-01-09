-- CreateTable
CREATE TABLE `cash_flow_forecasts` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `forecastDate` DATETIME(3) NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `predictedInflow` DECIMAL(15, 2) NOT NULL,
    `predictedOutflow` DECIMAL(15, 2) NOT NULL,
    `predictedBalance` DECIMAL(15, 2) NOT NULL,
    `confidence` DECIMAL(5, 2) NOT NULL,
    `bestCase` DECIMAL(15, 2) NOT NULL,
    `worstCase` DECIMAL(15, 2) NOT NULL,
    `mostLikely` DECIMAL(15, 2) NOT NULL,
    `modelVersion` VARCHAR(191) NOT NULL DEFAULT 'v1.0',
    `accuracy` DECIMAL(5, 2) NULL,
    `factors` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cash_flow_forecasts_brandId_forecastDate_idx`(`brandId`, `forecastDate`),
    UNIQUE INDEX `cash_flow_forecasts_brandId_forecastDate_key`(`brandId`, `forecastDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `liquidity_risks` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `riskDate` DATETIME(3) NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `type` ENUM('CASH_SHORTFALL', 'NEGATIVE_BALANCE', 'LOW_RUNWAY', 'SEASONAL_DIP', 'UNEXPECTED_EXPENSE') NOT NULL,
    `projectedCash` DECIMAL(15, 2) NOT NULL,
    `requiredCash` DECIMAL(15, 2) NOT NULL,
    `shortfall` DECIMAL(15, 2) NOT NULL,
    `recommendations` JSON NOT NULL,
    `status` ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'ACTIVE',
    `resolvedAt` DATETIME(3) NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `resolution` TEXT NULL,
    `detectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notifiedAt` DATETIME(3) NULL,

    INDEX `liquidity_risks_brandId_status_idx`(`brandId`, `status`),
    INDEX `liquidity_risks_severity_status_idx`(`severity`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reserve_recommendations` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `currentReserve` DECIMAL(15, 2) NOT NULL,
    `recommendedReserve` DECIMAL(15, 2) NOT NULL,
    `gap` DECIMAL(15, 2) NOT NULL,
    `reason` TEXT NOT NULL,
    `priority` INTEGER NOT NULL,
    `targetDate` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'IMPLEMENTED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `implementedAt` DATETIME(3) NULL,
    `implementedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reserve_recommendations_brandId_status_idx`(`brandId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cash_flow_forecasts` ADD CONSTRAINT `cash_flow_forecasts_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `liquidity_risks` ADD CONSTRAINT `liquidity_risks_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reserve_recommendations` ADD CONSTRAINT `reserve_recommendations_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
