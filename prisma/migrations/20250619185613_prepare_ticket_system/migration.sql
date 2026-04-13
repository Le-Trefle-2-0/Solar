-- CreateTable
CREATE TABLE `channel`
(
    `id`   VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ticket`
(
    `id`            INTEGER      NOT NULL AUTO_INCREMENT,
    `discordUserID` VARCHAR(191) NOT NULL,
    `channelId`     VARCHAR(191) NOT NULL,
    `createdAt`     DATETIME(3) NOT NULL,
    `updatedAt`     DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `message`
    ADD CONSTRAINT `Message_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `channel` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ticket`
    ADD CONSTRAINT `Ticket_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `channel` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
