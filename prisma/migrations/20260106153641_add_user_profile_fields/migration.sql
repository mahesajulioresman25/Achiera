/*
  Warnings:

  - You are about to drop the column `activeDays` on the `flash_sale_configs` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `verification_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `brand_configs` ADD COLUMN `loyaltySteps` JSON NULL,
    ADD COLUMN `loyaltyTiers` JSON NULL;

-- AlterTable
ALTER TABLE `flash_sale_configs` DROP COLUMN `activeDays`,
    ADD COLUMN `endDate` DATETIME(3) NULL,
    ADD COLUMN `startDate` DATETIME(3) NULL,
    ADD COLUMN `targetIds` JSON NOT NULL;

-- AlterTable
ALTER TABLE `loyalty_accounts` ADD COLUMN `isMarketingAllowed` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `loyalty_members` ADD COLUMN `isMarketingAllowed` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `subscription_items` ADD COLUMN `note` TEXT NULL;

-- AlterTable
ALTER TABLE `subscriptions` ADD COLUMN `end_date` DATETIME(3) NULL,
    ADD COLUMN `payment_proof` TEXT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `address` TEXT NULL,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `profileImage` TEXT NULL;

-- AlterTable
ALTER TABLE `verification_tokens` ADD COLUMN `attempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `whatsapp_queue` (
    `id` VARCHAR(191) NOT NULL,
    `brandId` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `priority` INTEGER NOT NULL DEFAULT 3,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` TEXT NULL,
    `scheduledFor` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sentAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `whatsapp_queue_status_scheduledFor_priority_idx`(`status`, `scheduledFor`, `priority`),
    INDEX `whatsapp_queue_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `whatsapp_queue` ADD CONSTRAINT `whatsapp_queue_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
