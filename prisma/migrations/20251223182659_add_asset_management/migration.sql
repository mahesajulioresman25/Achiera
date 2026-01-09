/*
  Warnings:

  - You are about to drop the column `accountId` on the `loyalty_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `loyalty_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `referenceId` on the `loyalty_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `action` on the `price_history` table. All the data in the column will be lost.
  - You are about to drop the column `payload` on the `price_history` table. All the data in the column will be lost.
  - You are about to drop the column `performedBy` on the `price_history` table. All the data in the column will be lost.
  - You are about to drop the column `ruleId` on the `price_history` table. All the data in the column will be lost.
  - Added the required column `balanceAfter` to the `loyalty_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `balanceBefore` to the `loyalty_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `memberId` to the `loyalty_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `points` to the `loyalty_transactions` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `loyalty_transactions` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `changePercent` to the `price_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `effectiveFrom` to the `price_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `newPrice` to the `price_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oldPrice` to the `price_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `price_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `variantId` to the `price_history` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `loyalty_transactions` DROP FOREIGN KEY `loyalty_transactions_accountId_fkey`;

-- DropIndex
DROP INDEX `price_history_ruleId_createdAt_idx` ON `price_history`;

-- AlterTable
ALTER TABLE `loyalty_transactions` DROP COLUMN `accountId`,
    DROP COLUMN `amount`,
    DROP COLUMN `referenceId`,
    ADD COLUMN `balanceAfter` INTEGER NOT NULL,
    ADD COLUMN `balanceBefore` INTEGER NOT NULL,
    ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `memberId` VARCHAR(191) NOT NULL,
    ADD COLUMN `orderId` VARCHAR(191) NULL,
    ADD COLUMN `points` INTEGER NOT NULL,
    MODIFY `description` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `price_history` DROP COLUMN `action`,
    DROP COLUMN `payload`,
    DROP COLUMN `performedBy`,
    DROP COLUMN `ruleId`,
    ADD COLUMN `changePercent` DECIMAL(5, 2) NOT NULL,
    ADD COLUMN `effectiveFrom` DATETIME(3) NOT NULL,
    ADD COLUMN `effectiveTo` DATETIME(3) NULL,
    ADD COLUMN `newPrice` DECIMAL(12, 2) NOT NULL,
    ADD COLUMN `oldPrice` DECIMAL(12, 2) NOT NULL,
    ADD COLUMN `reason` VARCHAR(191) NOT NULL,
    ADD COLUMN `revenueAfter` DECIMAL(15, 2) NULL,
    ADD COLUMN `revenueBefore` DECIMAL(15, 2) NULL,
    ADD COLUMN `salesAfter` INTEGER NULL,
    ADD COLUMN `salesBefore` INTEGER NULL,
    ADD COLUMN `triggeredBy` VARCHAR(191) NULL,
    ADD COLUMN `variantId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `recipes` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `frozenProductId` VARCHAR(191) NULL,
    `variantId` VARCHAR(191) NULL,
    `frozen_variant_id` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `outputQuantity` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `recipes_productId_key`(`productId`),
    UNIQUE INDEX `recipes_frozenProductId_key`(`frozenProductId`),
    UNIQUE INDEX `recipes_variantId_key`(`variantId`),
    UNIQUE INDEX `recipes_frozen_variant_id_key`(`frozen_variant_id`),
    INDEX `recipes_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recipe_items` (
    `id` VARCHAR(191) NOT NULL,
    `recipeId` VARCHAR(191) NOT NULL,
    `ingredient_id` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(12, 3) NOT NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `recipe_items_recipeId_idx`(`recipeId`),
    INDEX `recipe_items_ingredient_id_idx`(`ingredient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `production_plans` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `production_plans_brandId_date_idx`(`brandId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `production_plan_items` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `recipeId` VARCHAR(191) NOT NULL,
    `targetQuantity` INTEGER NOT NULL,
    `actualQuantity` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `production_plan_items_planId_idx`(`planId`),
    INDEX `production_plan_items_recipeId_idx`(`recipeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_mappings` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `externalName` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `automationActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_mappings_variantId_fkey`(`variantId`),
    UNIQUE INDEX `product_mappings_brandId_externalName_platform_key`(`brandId`, `externalName`, `platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketplace_daily_sales` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `reportDate` DATETIME(3) NOT NULL,
    `totalOrders` INTEGER NOT NULL DEFAULT 0,
    `totalRevenue` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `totalItems` INTEGER NOT NULL DEFAULT 0,
    `completedOrders` INTEGER NOT NULL DEFAULT 0,
    `canceledOrders` INTEGER NOT NULL DEFAULT 0,
    `returnedOrders` INTEGER NOT NULL DEFAULT 0,
    `topProducts` JSON NULL,
    `emailSubject` TEXT NULL,
    `rawData` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `marketplace_daily_sales_brandId_reportDate_idx`(`brandId`, `reportDate`),
    UNIQUE INDEX `marketplace_daily_sales_brandId_platform_reportDate_key`(`brandId`, `platform`, `reportDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketplace_campaign_reports` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `campaignName` VARCHAR(191) NOT NULL,
    `campaignType` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `totalViews` INTEGER NOT NULL DEFAULT 0,
    `totalClicks` INTEGER NOT NULL DEFAULT 0,
    `totalOrders` INTEGER NOT NULL DEFAULT 0,
    `totalRevenue` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `conversionRate` DECIMAL(5, 2) NULL,
    `emailSubject` TEXT NULL,
    `rawData` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `marketplace_campaign_reports_brandId_platform_idx`(`brandId`, `platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_reviews` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `externalOrderId` VARCHAR(191) NULL,
    `productName` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `reviewText` TEXT NULL,
    `customerName` VARCHAR(191) NULL,
    `reviewDate` DATETIME(3) NOT NULL,
    `sentiment` VARCHAR(191) NULL,
    `hasResponse` BOOLEAN NOT NULL DEFAULT false,
    `responseText` TEXT NULL,
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `customer_reviews_brandId_platform_rating_idx`(`brandId`, `platform`, `rating`),
    INDEX `customer_reviews_reviewDate_idx`(`reviewDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketplace_insights` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `insightType` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `actionable` BOOLEAN NOT NULL DEFAULT false,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    `reviewedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `marketplace_insights_brandId_status_priority_idx`(`brandId`, `status`, `priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demand_forecasts` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `forecastDate` DATETIME(3) NOT NULL,
    `predictedDemand` INTEGER NOT NULL,
    `confidence` DECIMAL(5, 2) NOT NULL,
    `historicalAvg` INTEGER NOT NULL DEFAULT 0,
    `trendFactor` DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    `seasonalFactor` DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    `actualDemand` INTEGER NULL,
    `accuracy` DECIMAL(5, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `demand_forecasts_brandId_forecastDate_idx`(`brandId`, `forecastDate`),
    INDEX `demand_forecasts_variantId_fkey`(`variantId`),
    UNIQUE INDEX `demand_forecasts_brandId_variantId_forecastDate_key`(`brandId`, `variantId`, `forecastDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_alerts` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `variantId` VARCHAR(191) NOT NULL,
    `alertType` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL,
    `currentStock` INTEGER NOT NULL,
    `recommendedAction` TEXT NOT NULL,
    `suggestedOrderQty` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `acknowledgedBy` VARCHAR(191) NULL,
    `acknowledgedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `stock_alerts_brandId_status_severity_idx`(`brandId`, `status`, `severity`),
    INDEX `stock_alerts_variantId_fkey`(`variantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pricing_rules` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `ruleType` VARCHAR(191) NOT NULL,
    `condition` JSON NOT NULL,
    `priceAdjustment` DECIMAL(5, 2) NOT NULL,
    `minPrice` DECIMAL(12, 2) NULL,
    `maxPrice` DECIMAL(12, 2) NULL,
    `applyToAll` BOOLEAN NOT NULL DEFAULT false,
    `targetVariants` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `timesTriggered` INTEGER NOT NULL DEFAULT 0,
    `totalRevenue` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pricing_rules_brandId_isActive_idx`(`brandId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loyalty_members` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerEmail` VARCHAR(191) NULL,
    `totalPoints` INTEGER NOT NULL DEFAULT 0,
    `availablePoints` INTEGER NOT NULL DEFAULT 0,
    `lifetimePoints` INTEGER NOT NULL DEFAULT 0,
    `tier` VARCHAR(191) NOT NULL DEFAULT 'BRONZE',
    `tierSince` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalOrders` INTEGER NOT NULL DEFAULT 0,
    `totalSpent` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `avgOrderValue` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `lastOrderDate` DATETIME(3) NULL,
    `daysSinceLastOrder` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `referralCode` VARCHAR(191) NOT NULL,
    `referredBy` VARCHAR(191) NULL,
    `referralCount` INTEGER NOT NULL DEFAULT 0,
    `birthday` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `loyalty_members_referralCode_key`(`referralCode`),
    INDEX `loyalty_members_brandId_tier_idx`(`brandId`, `tier`),
    INDEX `loyalty_members_brandId_totalPoints_idx`(`brandId`, `totalPoints`),
    UNIQUE INDEX `loyalty_members_brandId_customerPhone_key`(`brandId`, `customerPhone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loyalty_rewards` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `pointsCost` INTEGER NOT NULL,
    `rewardType` VARCHAR(191) NOT NULL,
    `rewardValue` DECIMAL(12, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `stock` INTEGER NULL,
    `minTier` VARCHAR(191) NOT NULL DEFAULT 'BRONZE',
    `timesRedeemed` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `loyalty_rewards_brandId_isActive_idx`(`brandId`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `business_assets` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `category` ENUM('EQUIPMENT', 'VEHICLE', 'BUILDING', 'FURNITURE', 'OTHER') NOT NULL,
    `purchaseDate` DATETIME(3) NOT NULL,
    `purchasePrice` DECIMAL(15, 2) NOT NULL,
    `usefulLifeMonths` INTEGER NOT NULL,
    `salvageValue` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM('ACTIVE', 'MAINTENANCE', 'DISPOSED', 'WRITTEN_OFF') NOT NULL DEFAULT 'ACTIVE',
    `ledgerAccountId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `business_assets_code_key`(`code`),
    INDEX `business_assets_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_depreciations` (
    `id` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `journalTransactionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `asset_depreciations_assetId_idx`(`assetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `loyalty_transactions_memberId_createdAt_idx` ON `loyalty_transactions`(`memberId`, `createdAt`);

-- CreateIndex
CREATE INDEX `price_history_variantId_effectiveFrom_idx` ON `price_history`(`variantId`, `effectiveFrom`);

-- AddForeignKey
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recipes` ADD CONSTRAINT `recipes_frozen_variant_id_fkey` FOREIGN KEY (`frozen_variant_id`) REFERENCES `frozen_variants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recipe_items` ADD CONSTRAINT `recipe_items_ingredient_id_fkey` FOREIGN KEY (`ingredient_id`) REFERENCES `frozen_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recipe_items` ADD CONSTRAINT `recipe_items_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `recipes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `production_plans` ADD CONSTRAINT `production_plans_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `production_plan_items` ADD CONSTRAINT `production_plan_items_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `production_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `production_plan_items` ADD CONSTRAINT `production_plan_items_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `recipes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_mappings` ADD CONSTRAINT `product_mappings_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_mappings` ADD CONSTRAINT `product_mappings_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `frozen_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_daily_sales` ADD CONSTRAINT `marketplace_daily_sales_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_campaign_reports` ADD CONSTRAINT `marketplace_campaign_reports_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_reviews` ADD CONSTRAINT `customer_reviews_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `marketplace_insights` ADD CONSTRAINT `marketplace_insights_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demand_forecasts` ADD CONSTRAINT `demand_forecasts_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demand_forecasts` ADD CONSTRAINT `demand_forecasts_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `frozen_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_alerts` ADD CONSTRAINT `stock_alerts_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_alerts` ADD CONSTRAINT `stock_alerts_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `frozen_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `price_history` ADD CONSTRAINT `price_history_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `frozen_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pricing_rules` ADD CONSTRAINT `pricing_rules_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_members` ADD CONSTRAINT `loyalty_members_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_transactions` ADD CONSTRAINT `loyalty_transactions_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `loyalty_members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_rewards` ADD CONSTRAINT `loyalty_rewards_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `business_assets` ADD CONSTRAINT `business_assets_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_depreciations` ADD CONSTRAINT `asset_depreciations_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `business_assets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
