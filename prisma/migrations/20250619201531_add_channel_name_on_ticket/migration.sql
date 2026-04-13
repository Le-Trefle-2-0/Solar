/*
  Warnings:

  - A unique constraint covering the columns `[id,name]` on the table `channel` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `channelName` to the `ticket` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ticket` DROP FOREIGN KEY `Ticket_channelId_fkey`;

-- DropIndex
DROP INDEX `Ticket_channelId_fkey` ON `ticket`;

-- AlterTable
ALTER TABLE `ticket`
    ADD COLUMN `channelName` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Channel_id_name_key` ON `channel` (`id`, `name`);

-- AddForeignKey
ALTER TABLE `ticket`
    ADD CONSTRAINT `Ticket_channelId_channelName_fkey` FOREIGN KEY (`channelId`, `channelName`) REFERENCES `channel` (`id`, `name`) ON DELETE CASCADE ON UPDATE CASCADE;
