/*
  Warnings:

  - You are about to drop the column `type` on the `Ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Ticket` DROP COLUMN `type`,
    MODIFY `channelId` VARCHAR(191) NULL,
    MODIFY `channelName` VARCHAR(191) NULL;
