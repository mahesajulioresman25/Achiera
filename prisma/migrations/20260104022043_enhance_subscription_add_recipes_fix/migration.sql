/*
  Warnings:

  - Added the required column `customer_address` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_name` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_phone` to the `subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `subscriptions` ADD COLUMN `customer_address` TEXT NOT NULL,
    ADD COLUMN `customer_email` VARCHAR(191) NULL,
    ADD COLUMN `customer_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `customer_phone` VARCHAR(191) NOT NULL,
    ADD COLUMN `last_order_date` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `community_recipes` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `author_name` VARCHAR(191) NOT NULL,
    `author_instagram` VARCHAR(191) NULL,
    `image_path` VARCHAR(191) NOT NULL,
    `ingredients` JSON NOT NULL,
    `steps` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `likes` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `community_recipes_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recipe_products` (
    `id` VARCHAR(191) NOT NULL,
    `recipe_id` VARCHAR(191) NOT NULL,
    `product_id` VARCHAR(191) NOT NULL,

    INDEX `recipe_products_recipe_id_idx`(`recipe_id`),
    INDEX `recipe_products_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `recipe_products` ADD CONSTRAINT `recipe_products_recipe_id_fkey` FOREIGN KEY (`recipe_id`) REFERENCES `community_recipes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recipe_products` ADD CONSTRAINT `recipe_products_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `frozen_products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
