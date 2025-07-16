-- CreateTable
CREATE TABLE `jwks`
(
    `id`         VARCHAR(191) NOT NULL,
    `publicKey`  TEXT         NOT NULL,
    `privateKey` TEXT         NOT NULL,
    `createdAt`  DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
