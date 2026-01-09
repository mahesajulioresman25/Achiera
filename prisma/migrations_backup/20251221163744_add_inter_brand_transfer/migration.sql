/*
  Warnings:

  - You are about to drop the column `budgetLimit` on the `ad_campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `ad_campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `objective` on the `ad_campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `ad_campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ad_campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `brandId` on the `brand_configs` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `brand_configs` table. All the data in the column will be lost.
  - You are about to drop the column `features` on the `brand_configs` table. All the data in the column will be lost.
  - You are about to drop the column `loyaltyRules` on the `brand_configs` table. All the data in the column will be lost.
  - You are about to drop the column `pricingStrategy` on the `brand_configs` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `brand_configs` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseRules` on the `brand_configs` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `brands` table. All the data in the column will be lost.
  - You are about to alter the column `debit` on the `journal_entries` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,2)` to `Decimal(15,2)`.
  - You are about to alter the column `credit` on the `journal_entries` table. The data in that column could be lost. The data in that column will be cast from `Decimal(20,2)` to `Decimal(15,2)`.
  - You are about to alter the column `type` on the `ledger_accounts` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(9))`.
  - You are about to drop the column `expiresAt` on the `loyalty_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `isExpired` on the `loyalty_transactions` table. All the data in the column will be lost.
  - The values [PENDING,WAITING_PAYMENT,PAYMENT_VERIFIED,IN_PRODUCTION,WAITING_FINAL_PAYMENT,QUALITY_CHECK,PACKING,SHIPPED,COMPLETED] on the enum `order_status_logs_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `status` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(9))` to `VarChar(191)`.
  - You are about to drop the column `code` on the `warehouses` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `warehouses` table. All the data in the column will be lost.
  - You are about to drop the `ad_creatives` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ad_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ad_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role_policies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stock_transfers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_alerts` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[brand_id]` on the table `brand_configs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customerPhone,brandId]` on the table `loyalty_accounts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[manualRef]` on the table `orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[brandId,name]` on the table `warehouses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `imageUrl` to the `ad_campaigns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linkUrl` to the `ad_campaigns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `ad_campaigns` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `audit_logs` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `brand_id` to the `brand_configs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `brand_configs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `journal_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ad_creatives` DROP FOREIGN KEY `ad_creatives_adGroupId_fkey`;

-- DropForeignKey
ALTER TABLE `ad_events` DROP FOREIGN KEY `ad_events_creativeId_fkey`;

-- DropForeignKey
ALTER TABLE `ad_groups` DROP FOREIGN KEY `ad_groups_campaignId_fkey`;

-- DropForeignKey
ALTER TABLE `audit_logs` DROP FOREIGN KEY `audit_logs_userId_fkey`;

-- DropForeignKey
ALTER TABLE `brand_configs` DROP FOREIGN KEY `brand_configs_brandId_fkey`;

-- DropForeignKey
ALTER TABLE `brands` DROP FOREIGN KEY `brands_organizationId_fkey`;

-- DropForeignKey
ALTER TABLE `loyalty_accounts` DROP FOREIGN KEY `loyalty_accounts_userId_fkey`;

-- DropForeignKey
ALTER TABLE `role_policies` DROP FOREIGN KEY `role_policies_brandId_fkey`;

-- DropForeignKey
ALTER TABLE `stock_transfers` DROP FOREIGN KEY `stock_transfers_destWarehouseId_fkey`;

-- DropForeignKey
ALTER TABLE `stock_transfers` DROP FOREIGN KEY `stock_transfers_sourceWarehouseId_fkey`;

-- DropForeignKey
ALTER TABLE `system_alerts` DROP FOREIGN KEY `system_alerts_brandId_fkey`;

-- DropIndex
DROP INDEX `audit_logs_brandId_createdAt_idx` ON `audit_logs`;

-- DropIndex
DROP INDEX `brand_configs_brandId_key` ON `brand_configs`;

-- DropIndex
DROP INDEX `warehouses_brandId_code_key` ON `warehouses`;

-- AlterTable
ALTER TABLE `ad_campaigns` DROP COLUMN `budgetLimit`,
    DROP COLUMN `endDate`,
    DROP COLUMN `objective`,
    DROP COLUMN `startDate`,
    DROP COLUMN `status`,
    ADD COLUMN `clicks` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `copytext` VARCHAR(191) NULL,
    ADD COLUMN `imageUrl` VARCHAR(191) NOT NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `linkUrl` VARCHAR(191) NOT NULL,
    ADD COLUMN `location` VARCHAR(191) NOT NULL,
    ADD COLUMN `priority` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `views` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `audit_logs` MODIFY `userId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `brand_configs` DROP COLUMN `brandId`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `features`,
    DROP COLUMN `loyaltyRules`,
    DROP COLUMN `pricingStrategy`,
    DROP COLUMN `updatedAt`,
    DROP COLUMN `warehouseRules`,
    ADD COLUMN `brand_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `emergency_paused` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `level_1_enabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `level_2_enabled` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `level_3_enabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `brands` DROP COLUMN `organizationId`;

-- AlterTable
ALTER TABLE `frozen_variants` ADD COLUMN `costPrice` DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE `journal_entries` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `description` TEXT NULL,
    MODIFY `debit` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    MODIFY `credit` DECIMAL(15, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `journal_transactions` ADD COLUMN `createdBy` VARCHAR(191) NOT NULL,
    ADD COLUMN `referenceType` VARCHAR(191) NULL,
    ALTER COLUMN `date` DROP DEFAULT,
    MODIFY `description` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `ledger_accounts` ADD COLUMN `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    MODIFY `type` ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL;

-- AlterTable
ALTER TABLE `loyalty_accounts` ADD COLUMN `customerPhone` VARCHAR(191) NULL,
    ADD COLUMN `lifetimeEarned` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lifetimeRedeemed` INTEGER NOT NULL DEFAULT 0,
    MODIFY `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `loyalty_transactions` DROP COLUMN `expiresAt`,
    DROP COLUMN `isExpired`;

-- AlterTable
ALTER TABLE `order_status_logs` MODIFY `status` ENUM('DIPESAN', 'DIBAYAR', 'DISIAPKAN', 'DIKIRIM', 'SELESAI', 'CANCELLED') NOT NULL;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `brand_id` VARCHAR(191) NULL,
    ADD COLUMN `channel` VARCHAR(191) NOT NULL DEFAULT 'WEBSITE',
    ADD COLUMN `emailSyncedAt` DATETIME(3) NULL,
    ADD COLUMN `external_order_id` VARCHAR(191) NULL,
    ADD COLUMN `internalNotes` TEXT NULL,
    ADD COLUMN `manualRef` VARCHAR(191) NULL,
    ADD COLUMN `operator_id` VARCHAR(191) NULL,
    ADD COLUMN `syncedFromEmail` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `total_amount` DECIMAL(12, 2) NULL,
    MODIFY `customerEmail` VARCHAR(191) NULL,
    MODIFY `customerPhone` VARCHAR(191) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'DIPESAN';

-- AlterTable
ALTER TABLE `warehouses` DROP COLUMN `code`,
    DROP COLUMN `isActive`,
    ADD COLUMN `isDefault` BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE `ad_creatives`;

-- DropTable
DROP TABLE `ad_events`;

-- DropTable
DROP TABLE `ad_groups`;

-- DropTable
DROP TABLE `organizations`;

-- DropTable
DROP TABLE `role_policies`;

-- DropTable
DROP TABLE `stock_transfers`;

-- DropTable
DROP TABLE `system_alerts`;

-- CreateTable
CREATE TABLE `decision_rules` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `ruleId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `autonomyLevel` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `condition` JSON NULL,
    `action` JSON NULL,
    `explanationTemplate` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `decision_rules_brandId_idx`(`brandId`),
    UNIQUE INDEX `decision_rules_brandId_ruleId_key`(`brandId`, `ruleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `execution_logs` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `ruleId` VARCHAR(191) NOT NULL,
    `decisionRuleId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `executedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decision_id` VARCHAR(191) NULL,

    INDEX `execution_logs_brandId_idx`(`brandId`),
    INDEX `execution_logs_decisionRuleId_idx`(`decisionRuleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trust_metrics_history` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `overallScore` DOUBLE NOT NULL,
    `ruleAcceptanceRate` DOUBLE NOT NULL,
    `aiAgreementRate` DOUBLE NOT NULL,
    `stabilityScore` DOUBLE NOT NULL,
    `forecastAccuracy` DOUBLE NOT NULL,

    INDEX `trust_metrics_history_brandId_date_idx`(`brandId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_explanation_logs` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `approvalRequestId` VARCHAR(191) NULL,
    `explanation` TEXT NOT NULL,
    `sentiment` VARCHAR(191) NULL,
    `confidenceScore` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_explanation_logs_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_requests` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `decisionId` VARCHAR(191) NOT NULL,
    `ruleId` VARCHAR(191) NOT NULL,
    `decisionRuleId` VARCHAR(191) NULL,
    `actionId` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `riskTier` VARCHAR(191) NOT NULL,
    `autonomyLevel` INTEGER NOT NULL,
    `requiredApprover` VARCHAR(191) NULL,
    `assignedTo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,
    `decidedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `rejectedBy` VARCHAR(191) NULL,
    `escalatedBy` VARCHAR(191) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `escalationReason` VARCHAR(191) NULL,
    `decisionContext` JSON NULL,
    `estimatedImpact` JSON NULL,
    `correlationId` VARCHAR(191) NULL,

    INDEX `approval_requests_brandId_state_idx`(`brandId`, `state`),
    INDEX `approval_requests_brandId_createdAt_idx`(`brandId`, `createdAt`),
    INDEX `approval_requests_decisionId_idx`(`decisionId`),
    INDEX `approval_requests_decisionRuleId_fkey`(`decisionRuleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_actions` (
    `id` VARCHAR(191) NOT NULL,
    `approvalRequestId` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `performedBy` VARCHAR(191) NOT NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fromState` VARCHAR(191) NOT NULL,
    `toState` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,

    INDEX `approval_actions_approvalRequestId_idx`(`approvalRequestId`),
    INDEX `approval_actions_brandId_performedAt_idx`(`brandId`, `performedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_policies` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `lowRiskApprover` VARCHAR(191) NULL,
    `mediumRiskApprover` VARCHAR(191) NULL,
    `highRiskApprover` VARCHAR(191) NULL,
    `criticalRiskApprover` VARCHAR(191) NULL,
    `defaultSlaHours` INTEGER NOT NULL DEFAULT 24,
    `escalationSlaHours` INTEGER NOT NULL DEFAULT 48,
    `autoApproveLevel0` BOOLEAN NOT NULL DEFAULT true,
    `autoApproveLevel1` BOOLEAN NOT NULL DEFAULT true,
    `autoApproveLevel2` BOOLEAN NOT NULL DEFAULT false,
    `autoApproveLevel3Low` BOOLEAN NOT NULL DEFAULT false,
    `autoEscalateAfterHours` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedBy` VARCHAR(191) NULL,

    UNIQUE INDEX `approval_policies_brandId_key`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `approval_escalations` (
    `id` VARCHAR(191) NOT NULL,
    `approvalRequestId` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `escalatedFrom` VARCHAR(191) NOT NULL,
    `escalatedTo` VARCHAR(191) NOT NULL,
    `escalatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `escalatedBy` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `urgency` VARCHAR(191) NOT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `resolution` VARCHAR(191) NULL,

    INDEX `approval_escalations_approvalRequestId_idx`(`approvalRequestId`),
    INDEX `approval_escalations_brandId_fkey`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manual_overrides` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `overrideType` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `performedBy` VARCHAR(191) NOT NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reason` VARCHAR(191) NOT NULL,
    `requiresJustification` BOOLEAN NOT NULL DEFAULT true,
    `justification` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `revokedAt` DATETIME(3) NULL,
    `revokedBy` VARCHAR(191) NULL,

    INDEX `manual_overrides_brandId_active_idx`(`brandId`, `active`),
    INDEX `manual_overrides_targetType_targetId_idx`(`targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget_policies` (
    `id` VARCHAR(191) NOT NULL,
    `brand_id` VARCHAR(191) NOT NULL,
    `daily_execution_limit` INTEGER NOT NULL DEFAULT 10,
    `daily_financial_cap` DECIMAL(65, 30) NOT NULL DEFAULT 5000000.000000000000000000000000000000,
    `weekly_execution_limit` INTEGER NOT NULL DEFAULT 50,
    `weekly_financial_cap` DECIMAL(65, 30) NOT NULL DEFAULT 20000000.000000000000000000000000000000,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `budget_policies_brand_id_key`(`brand_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `human_agreement_signals` (
    `id` VARCHAR(191) NOT NULL,
    `decision_id` VARCHAR(191) NOT NULL,
    `brand_id` VARCHAR(191) NOT NULL,
    `agreement` VARCHAR(191) NOT NULL,
    `reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `human_agreement_signals_brand_id_idx`(`brand_id`),
    INDEX `human_agreement_signals_decision_id_idx`(`decision_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suggestion_drafts` (
    `id` VARCHAR(191) NOT NULL,
    `brand_id` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `proposedAction` TEXT NOT NULL,
    `rationale` JSON NOT NULL,
    `expectedImpact` JSON NOT NULL,
    `confidence_score` DOUBLE NOT NULL,
    `risk_level` VARCHAR(191) NOT NULL,
    `phase_gate` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `suggestion_drafts_brand_id_idx`(`brand_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suggestion_feedbacks` (
    `id` VARCHAR(191) NOT NULL,
    `suggestion_id` VARCHAR(191) NOT NULL,
    `operator_id` VARCHAR(191) NOT NULL,
    `decision` VARCHAR(191) NOT NULL,
    `reason` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `suggestion_feedbacks_suggestion_id_idx`(`suggestion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `executive_confidence_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `brand_id` VARCHAR(191) NOT NULL,
    `reviewer_role` VARCHAR(191) NOT NULL,
    `dimensions` JSON NOT NULL,
    `comments` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `executive_confidence_reviews_brand_id_idx`(`brand_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assisted_actions` (
    `id` VARCHAR(191) NOT NULL,
    `suggestion_id` VARCHAR(191) NOT NULL,
    `brand_id` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `risk_tier` VARCHAR(191) NOT NULL,
    `reversal_plan` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `assisted_actions_brand_id_idx`(`brand_id`),
    INDEX `assisted_actions_suggestion_id_idx`(`suggestion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `action_approvals` (
    `id` VARCHAR(191) NOT NULL,
    `action_id` VARCHAR(191) NOT NULL,
    `operator_id` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `signed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acknowledgment` TEXT NULL,

    INDEX `action_approvals_action_id_idx`(`action_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `failure_simulations` (
    `id` VARCHAR(191) NOT NULL,
    `brand_id` VARCHAR(191) NOT NULL,
    `assisted_action_id` VARCHAR(191) NOT NULL,
    `simulation_id` VARCHAR(191) NOT NULL,
    `failure_type` VARCHAR(191) NOT NULL,
    `parameters` JSON NOT NULL,
    `simulated_impact` JSON NOT NULL,
    `rollback_success` BOOLEAN NOT NULL,
    `rollback_latency` INTEGER NOT NULL,
    `residual_risk` VARCHAR(191) NOT NULL,
    `governance_breach_flags` JSON NOT NULL,
    `reproducibility_hash` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `failure_simulations_simulation_id_key`(`simulation_id`),
    INDEX `failure_simulations_brand_id_idx`(`brand_id`),
    INDEX `failure_simulations_assisted_action_id_idx`(`assisted_action_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_reconciliations` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `paymentMethod` VARCHAR(191) NOT NULL,
    `paymentProof` TEXT NULL,
    `bankAccount` VARCHAR(191) NULL,
    `referenceNumber` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'REJECTED', 'DISPUTED') NOT NULL,
    `reconciledAt` DATETIME(3) NULL,
    `reconciledBy` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payment_reconciliations_brandId_status_idx`(`brandId`, `status`),
    INDEX `payment_reconciliations_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_mutations` (
    `id` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `type` ENUM('IN', 'OUT', 'ADJUSTMENT', 'EXPIRED', 'RETURN', 'TRANSFER') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `batchCode` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_mutations_warehouseId_variantId_idx`(`warehouseId`, `variantId`),
    INDEX `stock_mutations_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_integrations` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `emailAddress` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSyncAt` DATETIME(3) NULL,
    `totalSynced` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `email_integrations_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_campaigns` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `targetSegment` VARCHAR(191) NOT NULL,
    `messageTemplate` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `totalRecipients` INTEGER NOT NULL DEFAULT 0,
    `sentCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `whatsapp_campaigns_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_recipients` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `isSent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `whatsapp_recipients_campaignId_idx`(`campaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inter_brand_transfers` (
    `id` VARCHAR(191) NOT NULL,
    `sendingBrandId` VARCHAR(191) NOT NULL,
    `receivingBrandId` VARCHAR(191) NOT NULL,
    `type` ENUM('CASH', 'STOCK', 'SERVICE') NOT NULL,
    `value` DECIMAL(15, 2) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `inter_brand_transfers_sendingBrandId_idx`(`sendingBrandId`),
    INDEX `inter_brand_transfers_receivingBrandId_idx`(`receivingBrandId`),
    INDEX `inter_brand_transfers_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `audit_logs_brandId_idx` ON `audit_logs`(`brandId`);

-- CreateIndex
CREATE UNIQUE INDEX `brand_configs_brand_id_key` ON `brand_configs`(`brand_id`);

-- CreateIndex
CREATE INDEX `journal_transactions_brandId_date_idx` ON `journal_transactions`(`brandId`, `date`);

-- CreateIndex
CREATE INDEX `journal_transactions_referenceType_referenceId_idx` ON `journal_transactions`(`referenceType`, `referenceId`);

-- CreateIndex
CREATE INDEX `ledger_accounts_brandId_type_idx` ON `ledger_accounts`(`brandId`, `type`);

-- CreateIndex
CREATE UNIQUE INDEX `loyalty_accounts_customerPhone_brandId_key` ON `loyalty_accounts`(`customerPhone`, `brandId`);

-- CreateIndex
CREATE UNIQUE INDEX `orders_manualRef_key` ON `orders`(`manualRef`);

-- CreateIndex
CREATE INDEX `orders_brand_id_fkey` ON `orders`(`brand_id`);

-- CreateIndex
CREATE UNIQUE INDEX `warehouses_brandId_name_key` ON `warehouses`(`brandId`, `name`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_accounts` ADD CONSTRAINT `loyalty_accounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `decision_rules` ADD CONSTRAINT `decision_rules_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `execution_logs` ADD CONSTRAINT `execution_logs_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `execution_logs` ADD CONSTRAINT `execution_logs_decisionRuleId_fkey` FOREIGN KEY (`decisionRuleId`) REFERENCES `decision_rules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trust_metrics_history` ADD CONSTRAINT `trust_metrics_history_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_explanation_logs` ADD CONSTRAINT `ai_explanation_logs_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_requests` ADD CONSTRAINT `approval_requests_decisionRuleId_fkey` FOREIGN KEY (`decisionRuleId`) REFERENCES `decision_rules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_actions` ADD CONSTRAINT `approval_actions_approvalRequestId_fkey` FOREIGN KEY (`approvalRequestId`) REFERENCES `approval_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_actions` ADD CONSTRAINT `approval_actions_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_policies` ADD CONSTRAINT `approval_policies_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_escalations` ADD CONSTRAINT `approval_escalations_approvalRequestId_fkey` FOREIGN KEY (`approvalRequestId`) REFERENCES `approval_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `approval_escalations` ADD CONSTRAINT `approval_escalations_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manual_overrides` ADD CONSTRAINT `manual_overrides_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `brand_configs` ADD CONSTRAINT `brand_configs_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `budget_policies` ADD CONSTRAINT `budget_policies_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `human_agreement_signals` ADD CONSTRAINT `human_agreement_signals_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suggestion_drafts` ADD CONSTRAINT `suggestion_drafts_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suggestion_feedbacks` ADD CONSTRAINT `suggestion_feedbacks_suggestion_id_fkey` FOREIGN KEY (`suggestion_id`) REFERENCES `suggestion_drafts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `executive_confidence_reviews` ADD CONSTRAINT `executive_confidence_reviews_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assisted_actions` ADD CONSTRAINT `assisted_actions_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assisted_actions` ADD CONSTRAINT `assisted_actions_suggestion_id_fkey` FOREIGN KEY (`suggestion_id`) REFERENCES `suggestion_drafts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `action_approvals` ADD CONSTRAINT `action_approvals_action_id_fkey` FOREIGN KEY (`action_id`) REFERENCES `assisted_actions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `failure_simulations` ADD CONSTRAINT `failure_simulations_assisted_action_id_fkey` FOREIGN KEY (`assisted_action_id`) REFERENCES `assisted_actions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `failure_simulations` ADD CONSTRAINT `failure_simulations_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_reconciliations` ADD CONSTRAINT `payment_reconciliations_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_mutations` ADD CONSTRAINT `stock_mutations_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_mutations` ADD CONSTRAINT `stock_mutations_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `frozen_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_integrations` ADD CONSTRAINT `email_integrations_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `whatsapp_campaigns` ADD CONSTRAINT `whatsapp_campaigns_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `whatsapp_recipients` ADD CONSTRAINT `whatsapp_recipients_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `whatsapp_campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inter_brand_transfers` ADD CONSTRAINT `inter_brand_transfers_sendingBrandId_fkey` FOREIGN KEY (`sendingBrandId`) REFERENCES `brands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inter_brand_transfers` ADD CONSTRAINT `inter_brand_transfers_receivingBrandId_fkey` FOREIGN KEY (`receivingBrandId`) REFERENCES `brands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `journal_entries` RENAME INDEX `journal_entries_accountId_fkey` TO `journal_entries_accountId_idx`;

-- RenameIndex
ALTER TABLE `journal_entries` RENAME INDEX `journal_entries_transactionId_fkey` TO `journal_entries_transactionId_idx`;
