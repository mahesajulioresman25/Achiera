/*
  Warnings:

  - You are about to alter the column `action` on the `audit_logs` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(26))`.
  - Added the required column `userName` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userRole` to the `audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `audit_logs` DROP FOREIGN KEY `audit_logs_userId_fkey`;

-- AlterTable
ALTER TABLE `audit_logs` ADD COLUMN `changes` JSON NULL,
    ADD COLUMN `severity` ENUM('INFO', 'WARNING', 'CRITICAL', 'SECURITY') NOT NULL DEFAULT 'INFO',
    ADD COLUMN `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `userName` VARCHAR(191) NOT NULL,
    ADD COLUMN `userRole` VARCHAR(191) NOT NULL,
    MODIFY `action` ENUM('BUDGET_CREATED', 'BUDGET_APPROVED', 'BUDGET_REJECTED', 'BUDGET_MODIFIED', 'IC_TRANSACTION_CREATED', 'IC_TRANSACTION_APPROVED', 'IC_TRANSACTION_REJECTED', 'JOURNAL_ENTRY_CREATED', 'JOURNAL_ENTRY_MODIFIED', 'JOURNAL_ENTRY_DELETED', 'INVOICE_CREATED', 'INVOICE_PAID', 'EXPENSE_RECORDED', 'ASSET_CREATED', 'ASSET_DEPRECIATED', 'USER_LOGIN', 'USER_LOGOUT', 'ROLE_CHANGED', 'PERMISSION_MODIFIED', 'SETTINGS_CHANGED', 'POLICY_UPDATED', 'DATA_EXPORTED') NOT NULL;

-- CreateTable
CREATE TABLE `compliance_rules` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `category` ENUM('FINANCIAL_POLICY', 'APPROVAL_WORKFLOW', 'DATA_INTEGRITY', 'REGULATORY', 'OPERATIONAL', 'SECURITY') NOT NULL,
    `ruleType` ENUM('THRESHOLD', 'MANDATORY_FIELD', 'WORKFLOW', 'TIMING', 'SEGREGATION', 'LIMIT') NOT NULL,
    `conditions` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `brandId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `compliance_rules_isActive_category_idx`(`isActive`, `category`),
    INDEX `compliance_rules_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `compliance_violations` (
    `id` VARCHAR(191) NOT NULL,
    `ruleId` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('OPEN', 'INVESTIGATING', 'RESOLVED', 'WAIVED', 'FALSE_POSITIVE') NOT NULL DEFAULT 'OPEN',
    `resolvedBy` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolution` TEXT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `compliance_violations_status_severity_idx`(`status`, `severity`),
    INDEX `compliance_violations_brandId_createdAt_idx`(`brandId`, `createdAt`),
    INDEX `compliance_violations_ruleId_idx`(`ruleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `audit_logs_userId_timestamp_idx` ON `audit_logs`(`userId`, `timestamp`);

-- CreateIndex
CREATE INDEX `audit_logs_brandId_timestamp_idx` ON `audit_logs`(`brandId`, `timestamp`);

-- CreateIndex
CREATE INDEX `audit_logs_action_timestamp_idx` ON `audit_logs`(`action`, `timestamp`);

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compliance_rules` ADD CONSTRAINT `compliance_rules_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compliance_violations` ADD CONSTRAINT `compliance_violations_ruleId_fkey` FOREIGN KEY (`ruleId`) REFERENCES `compliance_rules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compliance_violations` ADD CONSTRAINT `compliance_violations_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compliance_violations` ADD CONSTRAINT `compliance_violations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
