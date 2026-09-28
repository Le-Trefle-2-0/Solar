-- Align auth tables with the schema better-auth 1.7 validates at startup.

-- AlterTable
ALTER TABLE `invitation` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable: API keys are now owned through referenceId (user or organization) + configId.
-- referenceId is added nullable, backfilled from userId, then made required.
ALTER TABLE `apikey` ADD COLUMN `configId` VARCHAR(191) NOT NULL DEFAULT 'default',
    ADD COLUMN `referenceId` VARCHAR(191) NULL,
    MODIFY `userId` VARCHAR(191) NULL;

UPDATE `apikey` SET `referenceId` = `userId` WHERE `referenceId` IS NULL;

ALTER TABLE `apikey` MODIFY `referenceId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `jwks` ADD COLUMN `expiresAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `apikey_configId_idx` ON `apikey`(`configId`);

-- CreateIndex
CREATE INDEX `apikey_referenceId_idx` ON `apikey`(`referenceId`);
