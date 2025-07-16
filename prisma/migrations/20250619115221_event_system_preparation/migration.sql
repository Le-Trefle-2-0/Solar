-- CreateTable
CREATE TABLE `Event`
(
    `id`          VARCHAR(191) NOT NULL,
    `title`       VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `location`    VARCHAR(191) NULL,
    `start`       DATETIME(3) NOT NULL,
    `end`         DATETIME(3) NOT NULL,
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3) NOT NULL,
    `userId`      VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleSlot`
(
    `id`       VARCHAR(191) NOT NULL,
    `role`     VARCHAR(191) NOT NULL,
    `maxCount` INTEGER      NOT NULL,
    `eventId`  VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventRegistration`
(
    `id`           VARCHAR(191) NOT NULL,
    `userId`       VARCHAR(191) NOT NULL,
    `roleSlotId`   VARCHAR(191) NOT NULL,
    `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eventId`      VARCHAR(191) NULL,

    UNIQUE INDEX `EventRegistration_userId_roleSlotId_key`(`userId`, `roleSlotId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Event`
    ADD CONSTRAINT `Event_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoleSlot`
    ADD CONSTRAINT `RoleSlot_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRegistration`
    ADD CONSTRAINT `EventRegistration_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRegistration`
    ADD CONSTRAINT `EventRegistration_roleSlotId_fkey` FOREIGN KEY (`roleSlotId`) REFERENCES `RoleSlot` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRegistration`
    ADD CONSTRAINT `EventRegistration_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
