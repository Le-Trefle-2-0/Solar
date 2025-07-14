/*
  Warnings:

  - A unique constraint covering the columns `[id,name]` on the table `Channel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `channelName` to the `Ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Ticket` DROP FOREIGN KEY `Ticket_channelId_fkey`;

-- DropIndex
DROP INDEX `Ticket_channelId_fkey` ON `Ticket`;

-- AlterTable
ALTER TABLE `Ticket`
    ADD COLUMN `channelName` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Channel_id_name_key` ON `Channel` (`id`, `name`);

-- AddForeignKey
ALTER TABLE `Ticket`
    ADD CONSTRAINT `Ticket_channelId_channelName_fkey` FOREIGN KEY (`channelId`, `channelName`) REFERENCES `Channel` (`id`, `name`) ON DELETE CASCADE ON UPDATE CASCADE;
