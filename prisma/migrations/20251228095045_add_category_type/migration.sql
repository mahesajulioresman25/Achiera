-- AlterTable
ALTER TABLE `frozen_categories` ADD COLUMN `category_type` ENUM('INTERNAL', 'PUBLIC') NOT NULL DEFAULT 'PUBLIC';
