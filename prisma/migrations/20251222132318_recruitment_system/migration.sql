-- CreateTable
CREATE TABLE `Recruitment`
(
    `id`          VARCHAR(191) NOT NULL,
    `title`       VARCHAR(191) NOT NULL,
    `description` LONGTEXT     NOT NULL,
    `icon`        VARCHAR(191) NULL,
    `fields`      JSON         NOT NULL,
    `enabled`     BOOLEAN      NOT NULL DEFAULT true,
    `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt`   DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
