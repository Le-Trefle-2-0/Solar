-- AlterTable
ALTER TABLE `user`
    ADD COLUMN `addressCity` TEXT NULL,
    ADD COLUMN `addressNumber` TEXT NULL,
    ADD COLUMN `addressPostalCode` TEXT NULL,
    ADD COLUMN `addressStreet` TEXT NULL,
    ADD COLUMN `birthDate` DATETIME(3) NULL,
    ADD COLUMN `casierFileId` VARCHAR(191) NULL,
    ADD COLUMN `casierRejectReason` TEXT NULL,
    ADD COLUMN `casierStatus` VARCHAR(191) NULL DEFAULT 'missing',
    ADD COLUMN `firstName` TEXT NULL,
    ADD COLUMN `idCardFileId` VARCHAR(191) NULL,
    ADD COLUMN `idCardRejectReason` TEXT NULL,
    ADD COLUMN `idCardStatus` VARCHAR(191) NULL DEFAULT 'missing',
    ADD COLUMN `lastName` TEXT NULL;

-- CreateTable
CREATE TABLE `file`
(
    `id`        VARCHAR(191) NOT NULL,
    `filename`  TEXT         NOT NULL,
    `content`   LONGBLOB     NOT NULL,
    `mime`      TEXT         NOT NULL,
    `size`      INTEGER      NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
