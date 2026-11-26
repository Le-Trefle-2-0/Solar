-- Columns required by better-auth 1.7 (#244).

-- API keys: named configurations. Existing keys belong to the default one.
-- (The plugin's `referenceId` is mapped onto the existing `userId` column in apps/web/lib/auth.ts.)
ALTER TABLE `apikey` ADD COLUMN `configId` VARCHAR(191) NOT NULL DEFAULT 'default';
CREATE INDEX `apikey_configId_idx` ON `apikey`(`configId`);

-- Two-factor: wrong-code counter and temporary lockout.
ALTER TABLE `two_factor` ADD COLUMN `failedVerificationCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `lockedUntil` DATETIME(3) NULL;

-- JWT signing keys: rotation and algorithm metadata.
ALTER TABLE `jwks` ADD COLUMN `expiresAt` DATETIME(3) NULL,
    ADD COLUMN `alg` VARCHAR(191) NULL,
    ADD COLUMN `crv` VARCHAR(191) NULL;

-- Organization invitations.
ALTER TABLE `invitation` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
