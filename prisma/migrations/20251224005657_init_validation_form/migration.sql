-- AlterTable
ALTER TABLE `user`
    ADD COLUMN `documentsRenewalAt` DATETIME(3) NULL,
    ADD COLUMN `documentsSentAt` DATETIME(3) NULL,
    ADD COLUMN `documentsStatus` VARCHAR(191) NULL DEFAULT 'missing',
    ADD COLUMN `documentsText` TEXT NULL,
    ADD COLUMN `documentsValidatedAt` DATETIME(3) NULL;
