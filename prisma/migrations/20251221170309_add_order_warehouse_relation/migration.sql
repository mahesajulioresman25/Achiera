-- AlterTable
ALTER TABLE `orders` ADD COLUMN `warehouseId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `orders_warehouseId_idx` ON `orders`(`warehouseId`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
