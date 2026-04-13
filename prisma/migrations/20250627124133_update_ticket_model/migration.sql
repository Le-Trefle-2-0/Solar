/*
  Warnings:

  - You are about to drop the column `type` on the `ticket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ticket` DROP COLUMN `type`,
    MODIFY `channelId` VARCHAR(191) NULL,
    MODIFY `channelName` VARCHAR(191) NULL;
