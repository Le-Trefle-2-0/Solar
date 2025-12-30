-- CreateTable
CREATE TABLE `newsletter`
(
    `id`          VARCHAR(191) NOT NULL,
    `title`       VARCHAR(191) NOT NULL,
    `content`     LONGBLOB     NOT NULL,
    `status`      VARCHAR(191) NOT NULL DEFAULT 'draft',
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3) NOT NULL,
    `sentAt`      DATETIME(3) NULL,
    `scheduledAt` DATETIME(3) NULL,
    `authorId`    VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `newsletter`
    ADD CONSTRAINT `newsletter_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
