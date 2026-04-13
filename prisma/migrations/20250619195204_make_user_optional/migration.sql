-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `Ticket_assignedUserId_fkey`;

-- DropIndex
DROP INDEX `Ticket_assignedUserId_fkey` ON `ticket`;

-- AlterTable
ALTER TABLE `ticket` MODIFY `assignedUserId` VARCHAR (191) NULL;

-- AddForeignKey
ALTER TABLE `ticket`
    ADD CONSTRAINT `Ticket_assignedUserId_fkey` FOREIGN KEY (`assignedUserId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
