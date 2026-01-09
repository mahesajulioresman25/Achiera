/*
  Warnings:

  - The values [ADMIN,EDITOR,VIEWER] on the enum `user_brand_roles_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `metadata` JSON NULL;

-- AlterTable
ALTER TABLE `payments` ADD COLUMN `destinationBankId` VARCHAR(191) NULL,
    ADD COLUMN `sourceBankName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user_brand_roles` MODIFY `role` ENUM('BRAND_ADMIN', 'BRAND_FINANCE', 'BRAND_WAREHOUSE_ADMIN', 'BRAND_MARKETING', 'WAREHOUSE_STAFF', 'CUSTOMER_SUPPORT', 'RESELLER', 'CONSUMER') NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `globalRole` ENUM('OWNER', 'PLATFORM_ADMIN', 'PLATFORM_FINANCE', 'PLATFORM_ANALYST', 'USER') NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE `bank_accounts` (
    `id` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `accountHolder` VARCHAR(191) NOT NULL,
    `logo` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_destinationBankId_fkey` FOREIGN KEY (`destinationBankId`) REFERENCES `bank_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
