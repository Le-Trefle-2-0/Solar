import {ALL_PERMISSIONS, type Permission} from './permissionCatalogue.js';

/**
 * Roles created on a fresh install, highest first (never overwritten afterwards: they can be
 * renamed, reordered, edited or deleted from the roles page, except the hidden "none").
 * Used by the API seed and by scripts/setup-admin.ts; the owner account gets the top one.
 */
export const DEFAULT_ROLES: {name: string; weight: number; icon: string; permissions: Permission[]}[] = [
    // Elected board: every access
    {name: "Conseil d'Administration", weight: 100, icon: 'Landmark', permissions: ['admin.sudo']},
    // Head of the listening department: everything but admin.sudo, below the board
    {
        name: 'Responsable pôle écoutes', weight: 90, icon: 'ShieldCheck',
        permissions: ALL_PERMISSIONS.filter(p => p !== 'admin.sudo'),
    },
    // Technical maintenance: configuration, system messages and health indicators.
    // No access to listening content, accounts or identity documents.
    {
        name: 'Administrateur Système', weight: 80, icon: 'Wrench', permissions: [
            'settings.manage', 'messages.manage', 'management.view_stats',
        ],
    },
    // Listening managers: run the planning, assign tickets, step into any ticket
    {
        name: 'Référent Bénévole Écoutant', weight: 50, icon: 'UserCheck', permissions: [
            'tickets.attribute', 'tickets.read_all', 'tickets.send_message_all', 'tickets.send_message',
            'tickets.close', 'tickets.transmission', 'tickets.launch_voice',
            'management.view_transmission',
            'permanence.open', 'permanence.close', 'permanence.register', 'permanence.unregister',
            'permanence.register_other_all', 'permanence.register_other_user',
            'permanence.unregister_other_all', 'permanence.unregister_other_user',
        ],
    },
    // Communication team
    {name: 'Rédacteur', weight: 30, icon: 'PenLine', permissions: ['newsletters.manage']},
    // Technical account of the Discord bot (created by POST /v1/bot/setup/account)
    {name: 'bot', weight: 20, icon: 'Bot', permissions: ['tickets.open', 'tickets.close', 'tickets.read_all', 'tickets.send_message_all']},
    // Listening volunteers: read and write the tickets assigned to them (no extra permission
    // needed for that), close and report on them, and sign up for planning events
    {
        name: 'Bénévole Écoutant', weight: 10, icon: 'Ear', permissions: [
            'tickets.send_message', 'tickets.close', 'tickets.transmission', 'tickets.launch_voice',
            'permanence.register', 'permanence.unregister',
        ],
    },
    // Default role: no permission. Hidden, cannot be renamed, deleted or given permissions.
    {name: 'none', weight: 0, icon: 'Ban', permissions: []},
];
