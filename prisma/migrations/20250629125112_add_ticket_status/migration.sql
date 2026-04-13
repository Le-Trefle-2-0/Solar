/*
  Warnings:

  - Added the required column `statusLabel` to the `ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `statusName` to the `ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ticket`
    ADD COLUMN `statusLabel` VARCHAR(191) NOT NULL,
    ADD COLUMN `statusName` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `ticket_status`
(
    `id`    BIGINT       NOT NULL AUTO_INCREMENT,
    `name`  VARCHAR(192) NOT NULL,
    `label` VARCHAR(192) NOT NULL,

    UNIQUE INDEX `name`(`name`),
    UNIQUE INDEX `TicketStatus_name_label_key`(`name`, `label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ticket`
    ADD CONSTRAINT `Ticket_statusName_statusLabel_fkey` FOREIGN KEY (`statusName`, `statusLabel`) REFERENCES `ticket_status` (`name`, `label`) ON DELETE RESTRICT ON UPDATE CASCADE;
