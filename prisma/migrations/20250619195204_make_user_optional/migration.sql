-- DropForeignKey
ALTER TABLE `Ticket` DROP FOREIGN KEY `Ticket_assignedUserId_fkey`;

-- DropIndex
DROP INDEX `Ticket_assignedUserId_fkey` ON `Ticket`;

-- AlterTable
ALTER TABLE `Ticket` MODIFY `assignedUserId` VARCHAR (191) NULL;

-- AddForeignKey
ALTER TABLE `Ticket`
    ADD CONSTRAINT `Ticket_assignedUserId_fkey` FOREIGN KEY (`assignedUserId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
