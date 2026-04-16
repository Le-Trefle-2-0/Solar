-- CreateTable
CREATE TABLE `settings`
(
    `key`   VARCHAR(191) NOT NULL,
    `value` TEXT         NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
