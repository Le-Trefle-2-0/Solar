import type {Permission} from './permissionCatalogue.js';

/**
 * Roles created on a fresh install (never overwritten afterwards: they can be renamed,
 * reordered, edited or deleted from the roles page, except "none").
 * Used by the API seed and by scripts/setup-admin.ts.
 */
export const DEFAULT_ROLES: {name: string; weight: number; icon: string; permissions: Permission[]}[] = [
    {name: 'admin', weight: 100, icon: 'Shield', permissions: ['admin.sudo']},
    {
        name: 'manager', weight: 50, icon: 'ShieldCheck', permissions: [
            'tickets.close', 'tickets.read_all', 'tickets.attribute', 'tickets.launch_voice', 'tickets.send_message_all',
            'management.manage_accounts', 'management.ticket_history', 'management.view_transmission', 'management.view_stats',
            'users.read_all',
            'permanence.open', 'permanence.close', 'permanence.register', 'permanence.unregister',
            'permanence.register_other_user', 'permanence.unregister_other_user', 'permanence.unregister_other_all',
            'messages.manage', 'roles.manage', 'settings.manage', 'recruitments.manage',
        ],
    },
    {name: 'bot', weight: 30, icon: 'Bot', permissions: ['tickets.open', 'tickets.close', 'tickets.read_all', 'tickets.send_message_all']},
    {name: 'newsletterManager', weight: 20, icon: 'Mail', permissions: ['newsletters.manage']},
    {
        name: 'volunteer', weight: 10, icon: 'Ear', permissions: [
            'tickets.close', 'tickets.launch_voice', 'tickets.send_message', 'tickets.transmission',
            'permanence.register', 'permanence.unregister',
        ],
    },
    {
        name: 'training', weight: 5, icon: 'GraduationCap', permissions: [
            'tickets.close', 'tickets.read_all', 'tickets.send_message', 'tickets.transmission',
            'management.view_transmission', 'permanence.register', 'permanence.unregister',
        ],
    },
    // Default role: no permission. Cannot be renamed, deleted or given permissions.
    {name: 'none', weight: 0, icon: 'Ban', permissions: []},
];
