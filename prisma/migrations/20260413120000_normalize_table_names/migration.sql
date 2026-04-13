-- Rename existing tables if they exist in uppercase (for systems like Linux where they might be distinct or for case preservation)
-- This script handles the transition to lowercase table names defined in @@map

-- Drop existing foreign keys to allow renaming
ALTER TABLE `Message` DROP FOREIGN KEY IF EXISTS `message_channelId_fkey`;
ALTER TABLE `Message` DROP FOREIGN KEY IF EXISTS `message_userId_fkey`;
ALTER TABLE `Event` DROP FOREIGN KEY IF EXISTS `Event_channelID_fkey`;
ALTER TABLE `Event` DROP FOREIGN KEY IF EXISTS `Event_userId_fkey`;
ALTER TABLE `EventRegistration` DROP FOREIGN KEY IF EXISTS `EventRegistration_eventId_fkey`;
ALTER TABLE `EventRegistration` DROP FOREIGN KEY IF EXISTS `EventRegistration_roleSlotId_fkey`;
ALTER TABLE `EventRegistration` DROP FOREIGN KEY IF EXISTS `EventRegistration_userId_fkey`;
ALTER TABLE `Reaction` DROP FOREIGN KEY IF EXISTS `Reaction_messageID_fkey`;
ALTER TABLE `Reaction` DROP FOREIGN KEY IF EXISTS `Reaction_userID_fkey`;
ALTER TABLE `RoleSlot` DROP FOREIGN KEY IF EXISTS `RoleSlot_eventId_fkey`;
ALTER TABLE `Ticket` DROP FOREIGN KEY IF EXISTS `Ticket_assignedUserId_fkey`;
ALTER TABLE `Ticket` DROP FOREIGN KEY IF EXISTS `Ticket_channelId_channelName_fkey`;
ALTER TABLE `Ticket` DROP FOREIGN KEY IF EXISTS `Ticket_statusName_statusLabel_fkey`;

-- Rename tables
RENAME
TABLE `Message` TO `message`;
RENAME
TABLE `Ticket` TO `ticket`;
RENAME
TABLE `Channel` TO `channel`;
RENAME
TABLE `Event` TO `event`;
RENAME
TABLE `RoleSlot` TO `role_slot`;
RENAME
TABLE `EventRegistration` TO `event_registration`;
RENAME
TABLE `Reaction` TO `reaction`;
RENAME
TABLE `TicketStatus` TO `ticket_status`;
RENAME
TABLE `Image` TO `image`;
RENAME
TABLE `Recruitment` TO `recruitment`;
RENAME
TABLE `twoFactor` TO `two_factor`;
RENAME
TABLE `routeProtection` TO `route_protection`;

-- Add foreign keys back with lowercase names
ALTER TABLE `message`
    ADD CONSTRAINT `message_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `message`
    ADD CONSTRAINT `message_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `channel` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reaction`
    ADD CONSTRAINT `reaction_messageID_fkey` FOREIGN KEY (`messageID`) REFERENCES `message` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `reaction`
    ADD CONSTRAINT `reaction_userID_fkey` FOREIGN KEY (`userID`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `event`
    ADD CONSTRAINT `event_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `event`
    ADD CONSTRAINT `event_channelID_fkey` FOREIGN KEY (`channelID`) REFERENCES `channel` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `role_slot`
    ADD CONSTRAINT `role_slot_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `event_registration`
    ADD CONSTRAINT `event_registration_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `event_registration`
    ADD CONSTRAINT `event_registration_roleSlotId_fkey` FOREIGN KEY (`roleSlotId`) REFERENCES `role_slot` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `event_registration`
    ADD CONSTRAINT `event_registration_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ticket`
    ADD CONSTRAINT `ticket_channelId_channelName_fkey` FOREIGN KEY (`channelId`, `channelName`) REFERENCES `channel` (`id`, `name`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ticket`
    ADD CONSTRAINT `ticket_assignedUserId_fkey` FOREIGN KEY (`assignedUserId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ticket`
    ADD CONSTRAINT `ticket_statusName_statusLabel_fkey` FOREIGN KEY (`statusName`, `statusLabel`) REFERENCES `ticket_status` (`name`, `label`) ON DELETE RESTRICT ON UPDATE CASCADE;
