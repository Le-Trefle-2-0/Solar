-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_userId_fkey`;

-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `Ticket_assignedUserId_fkey`;

-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `Ticket_channelId_channelName_fkey`;

-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `Ticket_statusName_statusLabel_fkey`;

-- AlterTable
ALTER TABLE `eventregistration`
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'confirmed';

-- AddForeignKey
ALTER TABLE `message`
    ADD CONSTRAINT `message_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message`
    ADD CONSTRAINT `message_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket`
    ADD CONSTRAINT `ticket_channelId_channelName_fkey` FOREIGN KEY (`channelId`, `channelName`) REFERENCES `Channel` (`id`, `name`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket`
    ADD CONSTRAINT `ticket_assignedUserId_fkey` FOREIGN KEY (`assignedUserId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket`
    ADD CONSTRAINT `ticket_statusName_statusLabel_fkey` FOREIGN KEY (`statusName`, `statusLabel`) REFERENCES `TicketStatus` (`name`, `label`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `ticket` RENAME INDEX `Ticket_channelId_key` TO `ticket_channelId_key`;
