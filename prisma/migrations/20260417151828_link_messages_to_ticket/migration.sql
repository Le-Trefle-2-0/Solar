-- AlterTable
ALTER TABLE `message`
    ADD COLUMN `ticketId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `message`
    ADD CONSTRAINT `message_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `ticket` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
