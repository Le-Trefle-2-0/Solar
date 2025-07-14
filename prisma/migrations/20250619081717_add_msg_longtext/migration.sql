-- AlterTable
ALTER TABLE `session`
    ADD COLUMN `activeOrganizationId` TEXT NULL,
    ADD COLUMN `impersonatedBy` TEXT NULL;

-- AlterTable
ALTER TABLE `user`
    ADD COLUMN `banExpires` DATETIME(3) NULL,
    ADD COLUMN `banReason` TEXT NULL,
    ADD COLUMN `banned` BOOLEAN NULL,
    ADD COLUMN `role` TEXT NULL,
    ADD COLUMN `twoFactorEnabled` BOOLEAN NULL;

-- CreateTable
CREATE TABLE `organization`
(
    `id`        VARCHAR(191) NOT NULL,
    `name`      TEXT         NOT NULL,
    `slug`      VARCHAR(191) NULL,
    `logo`      TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL,
    `metadata`  TEXT NULL,

    UNIQUE INDEX `organization_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member`
(
    `id`             VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId`         VARCHAR(191) NOT NULL,
    `role`           TEXT         NOT NULL,
    `createdAt`      DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invitation`
(
    `id`             VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `email`          TEXT         NOT NULL,
    `role`           TEXT NULL,
    `status`         TEXT         NOT NULL,
    `expiresAt`      DATETIME(3) NOT NULL,
    `inviterId`      VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `twoFactor`
(
    `id`          VARCHAR(191) NOT NULL,
    `secret`      TEXT         NOT NULL,
    `backupCodes` TEXT         NOT NULL,
    `userId`      VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message`
(
    `id`        INTEGER      NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL,
    `userId`    VARCHAR(191) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `content`   LONGTEXT     NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `member`
    ADD CONSTRAINT `member_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member`
    ADD CONSTRAINT `member_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitation`
    ADD CONSTRAINT `invitation_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `organization` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitation`
    ADD CONSTRAINT `invitation_inviterId_fkey` FOREIGN KEY (`inviterId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `twoFactor`
    ADD CONSTRAINT `twoFactor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message`
    ADD CONSTRAINT `Message_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
