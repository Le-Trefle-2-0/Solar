-- Better Auth reads an empty or NULL role as the default role, which used to be "admin" (#209, #237).
-- The default is now "none" (no permission); make it explicit for existing rows.
INSERT INTO `role` (`id`, `name`, `permissions`, `weight`, `icon`, `createdAt`, `updatedAt`)
SELECT UUID(), 'none', '[]', 0, 'Ban', NOW(3), NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `role` WHERE `name` = 'none');

UPDATE `user` SET `role` = 'none' WHERE `role` IS NULL OR TRIM(`role`) = '';
