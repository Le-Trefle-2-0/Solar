-- Team page: a person (name, photo, bio) can now appear in several teams. Existing members keep
-- their name, photo and bio: one person is created per distinct name, with the photo and bio of
-- the most recently updated entry that has one, and every entry is linked to it before the old
-- columns are dropped.

-- CreateTable
CREATE TABLE `team_person` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `image` LONGTEXT NULL,
    `bio` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `team_person_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `team_member` ADD COLUMN `personId` VARCHAR(191) NULL;

-- Move the people out of team_member
INSERT INTO `team_person` (`id`, `name`, `image`, `bio`, `createdAt`, `updatedAt`)
SELECT REPLACE(UUID(), '-', ''),
       g.`name`,
       (SELECT m.`image` FROM `team_member` m
        WHERE m.`name` = g.`name` AND m.`image` IS NOT NULL
        ORDER BY m.`updatedAt` DESC LIMIT 1),
       (SELECT m.`bio` FROM `team_member` m
        WHERE m.`name` = g.`name` AND m.`bio` IS NOT NULL
        ORDER BY m.`updatedAt` DESC LIMIT 1),
       g.`createdAt`,
       g.`updatedAt`
FROM (SELECT `name`, MIN(`createdAt`) AS `createdAt`, MAX(`updatedAt`) AS `updatedAt`
      FROM `team_member`
      GROUP BY `name`) g;

UPDATE `team_member` m
JOIN `team_person` p ON p.`name` = m.`name`
SET m.`personId` = p.`id`;

-- AlterTable
ALTER TABLE `team_member` DROP COLUMN `bio`,
    DROP COLUMN `image`,
    DROP COLUMN `name`;

-- CreateIndex
CREATE INDEX `team_member_personId_fkey` ON `team_member`(`personId`);

-- AddForeignKey
ALTER TABLE `team_member` ADD CONSTRAINT `team_member_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `team_person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
