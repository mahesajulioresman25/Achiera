-- AlterTable
ALTER TABLE `orders` ADD COLUMN `gift_message` TEXT NULL,
    ADD COLUMN `is_gift` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `recipient_email` VARCHAR(191) NULL,
    ADD COLUMN `recipient_name` VARCHAR(191) NULL;
