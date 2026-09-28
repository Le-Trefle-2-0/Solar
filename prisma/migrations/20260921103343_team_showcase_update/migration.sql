/*
  Warnings:

  - You are about to drop the column `bio` on the `team_member` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `team_member` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `team_member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `team_member` DROP COLUMN `bio`,
    DROP COLUMN `image`,
    DROP COLUMN `name`,
    ADD COLUMN `personId` VARCHAR(191) NULL;

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

-- CreateIndex
CREATE INDEX `team_member_personId_fkey` ON `team_member`(`personId`);

-- AddForeignKey
ALTER TABLE `team_member` ADD CONSTRAINT `team_member_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `team_person`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
