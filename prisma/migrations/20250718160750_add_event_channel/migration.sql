/*
  Warnings:

  - Added the required column `channelID` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Event`
    ADD COLUMN `channelID` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Event`
    ADD CONSTRAINT `Event_channelID_fkey` FOREIGN KEY (`channelID`) REFERENCES `Channel` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
