/*
  Warnings:

  - Added the required column `statusLabel` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statusName` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Ticket`
    ADD COLUMN `statusLabel` VARCHAR(191) NOT NULL,
    ADD COLUMN `statusName` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `TicketStatus`
(
    `id`    BIGINT       NOT NULL AUTO_INCREMENT,
    `name`  VARCHAR(192) NOT NULL,
    `label` VARCHAR(192) NOT NULL,

    UNIQUE INDEX `name`(`name`),
    UNIQUE INDEX `TicketStatus_name_label_key`(`name`, `label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Ticket`
    ADD CONSTRAINT `Ticket_statusName_statusLabel_fkey` FOREIGN KEY (`statusName`, `statusLabel`) REFERENCES `TicketStatus` (`name`, `label`) ON DELETE RESTRICT ON UPDATE CASCADE;
