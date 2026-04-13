-- DropForeignKey
ALTER TABLE `EventRegistration` DROP FOREIGN KEY `EventRegistration_eventId_fkey`;

-- DropForeignKey
ALTER TABLE `EventRegistration` DROP FOREIGN KEY `EventRegistration_roleSlotId_fkey`;

-- DropForeignKey
ALTER TABLE `RoleSlot` DROP FOREIGN KEY `RoleSlot_eventId_fkey`;

-- DropIndex
DROP INDEX `EventRegistration_eventId_fkey` ON `EventRegistration`;

-- DropIndex
DROP INDEX `EventRegistration_roleSlotId_fkey` ON `EventRegistration`;

-- DropIndex
DROP INDEX `RoleSlot_eventId_fkey` ON `RoleSlot`;

-- AddForeignKey
ALTER TABLE `RoleSlot`
    ADD CONSTRAINT `RoleSlot_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRegistration`
    ADD CONSTRAINT `EventRegistration_roleSlotId_fkey` FOREIGN KEY (`roleSlotId`) REFERENCES `RoleSlot` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRegistration`
    ADD CONSTRAINT `EventRegistration_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
