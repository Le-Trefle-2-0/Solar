-- Team showcase: people linked to a Discord account, kept up to date (name and photo).
ALTER TABLE `team_person` ADD COLUMN `discordId` VARCHAR(32) NULL,
    ADD COLUMN `syncName` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `syncImage` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `discordAvatarHash` VARCHAR(191) NULL,
    ADD COLUMN `discordSyncedAt` DATETIME(3) NULL,
    ADD COLUMN `discordSyncError` TEXT NULL;
CREATE UNIQUE INDEX `team_person_discordId_key` ON `team_person`(`discordId`);
