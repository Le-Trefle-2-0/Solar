/*
  Warnings:

  - A unique constraint covering the columns `[channelId]` on the table `ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `ticket_channelId_key` ON `ticket` (`channelId`);
