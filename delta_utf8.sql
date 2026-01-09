-- AlterTable
ALTER TABLE `orders` ADD COLUMN `channel` VARCHAR(191) NOT NULL DEFAULT 'WEBSITE',
    ADD COLUMN `internalNotes` TEXT NULL,
    ADD COLUMN `operator_id` VARCHAR(191) NULL,
    ADD COLUMN `total_amount` DECIMAL(12, 2) NULL,
    MODIFY `customerEmail` VARCHAR(191) NULL,
    MODIFY `customerPhone` VARCHAR(191) NULL,
    MODIFY `status` ENUM('DIPESAN', 'DIBAYAR', 'DISIAPKAN', 'DIKIRIM', 'SELESAI', 'CANCELLED') NOT NULL DEFAULT 'DIPESAN';

-- RenameIndex
ALTER TABLE `orders` RENAME INDEX `manualRef` TO `orders_manualRef_key`;

