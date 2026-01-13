/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- Keep message content type update (already consistent with later migration)
ALTER TABLE `message` MODIFY `content` LONGBLOB NOT NULL;

-- Columns `displayUsername` and `username` were already added in 20250619134439_update
-- Skipping duplicate additions here to avoid MySQL 1060 duplicate column errors.
-- ALTER TABLE `user` ADD COLUMN `displayUsername` TEXT NULL,
--     ADD COLUMN `username` VARCHAR(191) NULL;

-- Skipped: Channel table already exists from earlier migration (20250619185613_prepare_ticket_system)
-- CREATE TABLE `Channel` (
--     `id` VARCHAR(191) NOT NULL,
--     `name` VARCHAR(191) NOT NULL,
--
--     UNIQUE INDEX `Channel_id_name_key`(`id`, `name`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Skipped: Event table already exists from 20250619115221_event_system_preparation
-- CREATE TABLE `Event` (...);

-- Skipped: RoleSlot table already exists from 20250619115221_event_system_preparation
-- CREATE TABLE `RoleSlot` (...);

-- Skipped: EventRegistration table already exists from 20250619115221_event_system_preparation
-- CREATE TABLE `EventRegistration` (...);

-- Skipped: Ticket table already exists from 20250619185613_prepare_ticket_system and has been evolved by later migrations
-- CREATE TABLE `Ticket` (...);

-- Skipped: TicketStatus already added in 20250629125112_add_ticket_status
-- CREATE TABLE `TicketStatus` (...);

-- Skipped: apikey already created in 20250620134831_add_api_key_plugin
-- CREATE TABLE `apikey` (...);

-- Skipped: jwks already created in 20250620161059_add_jwt
-- CREATE TABLE `jwks` (...);

-- Skipped: routeProtection not part of current schema; omit to prevent drift
-- CREATE TABLE `routeProtection` (...);

-- Skipped: passkey already created in 20250629114000_add_passkey
-- CREATE TABLE `passkey` (...);

-- Unique index for username already created in 20250619134439_update
-- Skipping duplicate index creation here.
-- CREATE UNIQUE INDEX `user_username_key` ON `user`(`username`);

-- Skipped: Message_channelId_fkey already added in earlier migration
-- ALTER TABLE `Message` ADD CONSTRAINT `Message_channelId_fkey` FOREIGN KEY (...);

-- Skipped: Event_userId_fkey already exists

-- Skipped: RoleSlot_eventId_fkey already exists

-- Skipped: EventRegistration_userId_fkey already exists

-- Skipped: EventRegistration_roleSlotId_fkey already exists

-- Skipped: EventRegistration_eventId_fkey already exists

-- Skipped: Ticket_channelId_channelName_fkey handled by later migrations

-- Skipped: Ticket_assignedUserId_fkey handled by later migrations

-- Skipped: Ticket_statusName_statusLabel_fkey handled by later migrations

-- Skipped: apikey_userId_fkey exists from 20250620134831_add_api_key_plugin

-- Skipped: passkey_userId_fkey exists from 20250629114000_add_passkey
