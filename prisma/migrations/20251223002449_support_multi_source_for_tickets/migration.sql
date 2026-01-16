-- AlterTable
ALTER TABLE `Ticket`
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `source` VARCHAR(191) NOT NULL DEFAULT 'discord';
