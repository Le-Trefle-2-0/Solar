-- Discord bot relay (#297, #298): when a volunteer's message reached the Discord user, or why not.
ALTER TABLE `message` ADD COLUMN `relayedAt` DATETIME(3) NULL,
    ADD COLUMN `relayFailed` BOOLEAN NOT NULL DEFAULT false;
