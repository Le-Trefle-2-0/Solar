-- AlterTable
ALTER TABLE `two_factor` ADD COLUMN `failedVerificationCount` INTEGER NULL DEFAULT 0,
    ADD COLUMN `lockedUntil` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `jwks` ADD COLUMN `alg` VARCHAR(191) NULL,
    ADD COLUMN `crv` VARCHAR(191) NULL;

