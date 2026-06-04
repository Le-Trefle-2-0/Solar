-- Add missing `voice` column to `ticket` to match schema.prisma
-- Note: use plain ADD COLUMN for broad MySQL compatibility
ALTER TABLE `ticket`
    ADD COLUMN `voice` TINYINT(1) NOT NULL DEFAULT 0;
