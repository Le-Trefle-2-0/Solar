/*
  Warnings:

  - A unique constraint covering the columns `[channelId]` on the table `Ticket` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Ticket_channelId_key` ON `Ticket` (`channelId`);
