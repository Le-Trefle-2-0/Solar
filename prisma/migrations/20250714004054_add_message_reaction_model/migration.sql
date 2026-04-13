-- CreateTable
CREATE TABLE `reaction`
(
    `id`        VARCHAR(191) NOT NULL,
    `emoji`     VARCHAR(191) NOT NULL,
    `messageID` INTEGER      NOT NULL,
    `userID`    VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reaction`
    ADD CONSTRAINT `Reaction_messageID_fkey` FOREIGN KEY (`messageID`) REFERENCES `message` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reaction`
    ADD CONSTRAINT `Reaction_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
