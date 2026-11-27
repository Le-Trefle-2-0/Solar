-- Team notes in transcripts (identity revealed…), never shown to the visitor or the Discord user
ALTER TABLE `message` ADD COLUMN `internal` BOOLEAN NOT NULL DEFAULT false;

-- Vigilances about a requester, known by the keyed hash of their Discord id
CREATE TABLE `vigilance` (
    `id` VARCHAR(191) NOT NULL,
    `requesterHash` VARCHAR(80) NOT NULL,
    `category` VARCHAR(64) NOT NULL,
    `note` TEXT NULL,
    `ticketId` INTEGER NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `vigilance_requesterHash_idx`(`requesterHash`),
    INDEX `vigilance_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `vigilance` ADD CONSTRAINT `vigilance_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
