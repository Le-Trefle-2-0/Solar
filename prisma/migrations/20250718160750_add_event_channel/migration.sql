/*
  Warnings:

  - Added the required column `channelID` to the `event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `event`
    ADD COLUMN `channelID` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `event`
    ADD CONSTRAINT `Event_channelID_fkey` FOREIGN KEY (`channelID`) REFERENCES `channel` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
