-- AlterTable
ALTER TABLE `ticket`
    ADD COLUMN `info` VARCHAR(191) NULL,
    ADD COLUMN `observations` VARCHAR(191) NULL,
    ADD COLUMN `problematic` VARCHAR(191) NULL;
