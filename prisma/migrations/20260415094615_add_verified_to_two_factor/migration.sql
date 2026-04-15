/*
  Warnings:

  - Added the required column `verified` to the `two_factor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `event_registration` DROP FOREIGN KEY `event_registration_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `event_registration` DROP FOREIGN KEY `event_registration_roleSlotId_fkey`;

-- DropForeignKey
ALTER TABLE `role_slot` DROP FOREIGN KEY `role_slot_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `two_factor` DROP FOREIGN KEY `twoFactor_userId_fkey`;

-- DropIndex
DROP INDEX `event_registration_eventId_fkey` ON `event_registration`;

-- DropIndex
DROP INDEX `event_registration_roleSlotId_fkey` ON `event_registration`;

-- DropIndex
DROP INDEX `role_slot_eventId_fkey` ON `role_slot`;

-- AlterTable
ALTER TABLE `two_factor`
    ADD COLUMN `verified` BOOLEAN NOT NULL;

-- AddForeignKey
ALTER TABLE `two_factor`
    ADD CONSTRAINT `two_factor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_slot`
    ADD CONSTRAINT `role_slot_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registration`
    ADD CONSTRAINT `event_registration_roleSlotId_fkey` FOREIGN KEY (`roleSlotId`) REFERENCES `role_slot` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_registration`
    ADD CONSTRAINT `event_registration_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `route_protection` RENAME INDEX `routeProtection_route_key` TO `route_protection_route_key`;
