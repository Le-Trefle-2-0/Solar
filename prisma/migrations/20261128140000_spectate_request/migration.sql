-- Volunteers in training asking to observe an écoute, read-only, once a manager approves
CREATE TABLE `spectate_request` (
    `id` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `ticketId` INTEGER NULL,
    `decidedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decidedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,

    INDEX `spectate_request_eventId_status_idx`(`eventId`, `status`),
    INDEX `spectate_request_userId_status_idx`(`userId`, `status`),
    INDEX `spectate_request_ticketId_status_idx`(`ticketId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `spectate_request` ADD CONSTRAINT `spectate_request_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `spectate_request` ADD CONSTRAINT `spectate_request_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `spectate_request` ADD CONSTRAINT `spectate_request_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `ticket`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
