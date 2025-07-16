-- CreateTable
CREATE TABLE `apikey`
(
    `id`                  VARCHAR(191) NOT NULL,
    `name`                TEXT NULL,
    `start`               TEXT NULL,
    `prefix`              TEXT NULL,
    `key`                 TEXT         NOT NULL,
    `userId`              VARCHAR(191) NOT NULL,
    `refillInterval`      INTEGER NULL,
    `refillAmount`        INTEGER NULL,
    `lastRefillAt`        DATETIME(3) NULL,
    `enabled`             BOOLEAN NULL,
    `rateLimitEnabled`    BOOLEAN NULL,
    `rateLimitTimeWindow` INTEGER NULL,
    `rateLimitMax`        INTEGER NULL,
    `requestCount`        INTEGER NULL,
    `remaining`           INTEGER NULL,
    `lastRequest`         DATETIME(3) NULL,
    `expiresAt`           DATETIME(3) NULL,
    `createdAt`           DATETIME(3) NOT NULL,
    `updatedAt`           DATETIME(3) NOT NULL,
    `permissions`         TEXT NULL,
    `metadata`            TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `apikey`
    ADD CONSTRAINT `apikey_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
