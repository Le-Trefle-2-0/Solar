/*
  Warnings:

  - Added the required column `assignedUserId` to the `Ticket` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Ticket`
    ADD COLUMN `assignedUserId` VARCHAR(191) NOT NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Ticket`
    ADD CONSTRAINT `Ticket_assignedUserId_fkey` FOREIGN KEY (`assignedUserId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
