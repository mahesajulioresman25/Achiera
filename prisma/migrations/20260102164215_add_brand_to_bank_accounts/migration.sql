-- AlterTable
ALTER TABLE `bank_accounts` ADD COLUMN `brandId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `brand_configs` ADD COLUMN `instagramHandle` TEXT NULL,
    ADD COLUMN `operational_overhead` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `overhead_breakdown` JSON NULL,
    ADD COLUMN `socialLinks` JSON NULL;

-- AlterTable
ALTER TABLE `hero_slides` ADD COLUMN `tagline` TEXT NULL;

-- AlterTable
ALTER TABLE `order_status_logs` MODIFY `status` ENUM('DIPESAN', 'MENUNGGU_VERIFIKASI_QRIS', 'DIBAYAR', 'DISIAPKAN', 'DIKIRIM', 'SELESAI', 'CANCELLED') NOT NULL;

-- CreateIndex
CREATE INDEX `bank_accounts_brandId_idx` ON `bank_accounts`(`brandId`);

-- AddForeignKey
ALTER TABLE `bank_accounts` ADD CONSTRAINT `bank_accounts_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brands`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
