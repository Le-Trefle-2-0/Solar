-- Owner + permission-based access (roles no longer get powers from their name).
-- Keeps existing installs working: what "admin" and "manager" could do by name is now
-- granted through permissions on those roles.

-- 1. Owner: the oldest account holding the "admin" role, unless an owner is already set.
INSERT INTO `settings` (`key`, `value`)
SELECT 'owner_user_id', u.`id`
FROM `user` u
WHERE FIND_IN_SET('admin', REPLACE(u.`role`, ' ', '')) > 0
  AND NOT EXISTS (SELECT 1 FROM `settings` WHERE `key` = 'owner_user_id')
ORDER BY u.`createdAt` ASC
LIMIT 1;

-- 2. Helper: add a permission to a role's JSON array when missing.
--    (Rows with invalid JSON are left untouched.)
UPDATE `role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'admin.sudo')
WHERE `name` = 'admin' AND JSON_VALID(`permissions`) AND NOT JSON_CONTAINS(`permissions`, '"admin.sudo"');

UPDATE `role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'newsletters.manage')
WHERE `name` = 'newsletterManager' AND JSON_VALID(`permissions`) AND NOT JSON_CONTAINS(`permissions`, '"newsletters.manage"');

-- 3. "manager" used to open the admin pages, the planning tools and document validation by name.
UPDATE `role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'roles.manage')
WHERE `name` = 'manager' AND JSON_VALID(`permissions`) AND NOT JSON_CONTAINS(`permissions`, '"roles.manage"');
UPDATE `role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'settings.manage')
WHERE `name` = 'manager' AND JSON_VALID(`permissions`) AND NOT JSON_CONTAINS(`permissions`, '"settings.manage"');
UPDATE `role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'recruitments.manage')
WHERE `name` = 'manager' AND JSON_VALID(`permissions`) AND NOT JSON_CONTAINS(`permissions`, '"recruitments.manage"');
UPDATE `role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'management.manage_accounts')
WHERE `name` = 'manager' AND JSON_VALID(`permissions`) AND NOT JSON_CONTAINS(`permissions`, '"management.manage_accounts"');
UPDATE `role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'management.ticket_history')
WHERE `name` = 'manager' AND JSON_VALID(`permissions`) AND NOT JSON_CONTAINS(`permissions`, '"management.ticket_history"');
UPDATE `role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'management.view_stats')
WHERE `name` = 'manager' AND JSON_VALID(`permissions`) AND NOT JSON_CONTAINS(`permissions`, '"management.view_stats"');
UPDATE `role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'permanence.open')
WHERE `name` = 'manager' AND JSON_VALID(`permissions`) AND NOT JSON_CONTAINS(`permissions`, '"permanence.open"');
UPDATE `role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'permanence.unregister_other_all')
WHERE `name` = 'manager' AND JSON_VALID(`permissions`) AND NOT JSON_CONTAINS(`permissions`, '"permanence.unregister_other_all"');
UPDATE `role` SET `permissions` = JSON_ARRAY_APPEND(`permissions`, '$', 'permanence.register_other_user')
WHERE `name` = 'manager' AND JSON_VALID(`permissions`) AND NOT JSON_CONTAINS(`permissions`, '"permanence.register_other_user"');
