-- Add missing `voice` column to `Ticket` to match schema.prisma
-- Note: use plain ADD COLUMN for broad MySQL compatibility
ALTER TABLE `Ticket`
    ADD COLUMN `voice` TINYINT(1) NOT NULL DEFAULT 0;
