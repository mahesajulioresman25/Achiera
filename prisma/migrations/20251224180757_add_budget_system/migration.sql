-- CreateTable
CREATE TABLE `budgets` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `fiscalYear` INTEGER NOT NULL,
    `period` ENUM('ANNUAL', 'QUARTERLY', 'MONTHLY') NOT NULL DEFAULT 'ANNUAL',
    `revenueTarget` DECIMAL(15, 2) NOT NULL,
    `expenseTarget` DECIMAL(15, 2) NOT NULL,
    `profitTarget` DECIMAL(15, 2) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `status` ENUM('DRAFT', 'APPROVED', 'LOCKED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `budgets_fiscalYear_status_idx`(`fiscalYear`, `status`),
    UNIQUE INDEX `budgets_brandId_fiscalYear_period_key`(`brandId`, `fiscalYear`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget_breakdowns` (
    `id` VARCHAR(191) NOT NULL,
    `budgetId` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `revenueTarget` DECIMAL(15, 2) NOT NULL,
    `expenseTarget` DECIMAL(15, 2) NOT NULL,
    `profitTarget` DECIMAL(15, 2) NOT NULL,

    UNIQUE INDEX `budget_breakdowns_budgetId_month_key`(`budgetId`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_breakdowns` ADD CONSTRAINT `budget_breakdowns_budgetId_fkey` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
