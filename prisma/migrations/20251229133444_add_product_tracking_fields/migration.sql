-- AlterTable
ALTER TABLE `frozen_products` ADD COLUMN `featuredOrder` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `orderCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `viewCount` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `frozen_products_isFeatured_featuredOrder_idx` ON `frozen_products`(`isFeatured`, `featuredOrder`);

-- CreateIndex
CREATE INDEX `frozen_products_orderCount_idx` ON `frozen_products`(`orderCount`);
