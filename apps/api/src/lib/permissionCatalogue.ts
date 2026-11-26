/**
 * Every permission a role can hold. Mirrors ALL_PERMISSIONS in apps/web/lib/permissions.ts;
 * permissionCatalogue.test.ts fails if the two drift apart.
 */
export const ALL_PERMISSIONS = [
    'tickets.open', 'tickets.close', 'tickets.read_all', 'tickets.attribute', 'tickets.launch_voice',
    'tickets.send_message_all', 'tickets.send_message', 'tickets.transmission',
    'management.manage_accounts', 'management.ticket_history', 'management.view_transmission', 'management.view_stats',
    'users.read_all',
    'permanence.open', 'permanence.close', 'permanence.register', 'permanence.unregister',
    'permanence.unregister_other_all', 'permanence.unregister_other_user',
    'permanence.register_other_all', 'permanence.register_other_user',
    'messages.manage', 'newsletters.manage',
    'roles.manage', 'settings.manage', 'recruitments.manage',
    'admin.sudo',
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

const KNOWN = new Set<string>(ALL_PERMISSIONS);
export const isKnownPermission = (p: unknown): p is Permission => typeof p === 'string' && KNOWN.has(p);

/** The default role: no permission. Better Auth also falls back to it when a role is empty. */
export const DEFAULT_ROLE = 'none';
