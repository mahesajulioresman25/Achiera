-- AlterTable
ALTER TABLE `analytics_events` ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `referrer` TEXT NULL,
    ADD COLUMN `sessionId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `analytics_events_brandId_sessionId_idx` ON `analytics_events`(`brandId`, `sessionId`);

-- CreateIndex
CREATE INDEX `analytics_events_brandId_path_idx` ON `analytics_events`(`brandId`, `path`);
