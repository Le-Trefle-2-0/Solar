import {ALL_PERMISSIONS, type Permission} from './permissionCatalogue.js';

/**
 * Two-factor authentication is required for every privileged permission (#17). Without it, an
 * account only keeps what a listening volunteer (or one in training) needs; the rest is withheld
 * until 2FA is enabled. Anything not listed here is privileged, new permissions included.
 * Same rules as apps/web/lib/twoFactorGate.ts.
 */
export const BASIC_PERMISSIONS: readonly Permission[] = [
    'tickets.send_message', 'tickets.close', 'tickets.transmission', 'tickets.launch_voice', 'tickets.spectate',
    'permanence.register', 'permanence.unregister',
];

const BASIC = new Set<string>(BASIC_PERMISSIONS);

export function applyTwoFactorGate(granted: string[], hasTwoFactor: boolean)
    : {permissions: string[]; needsTwoFactor: boolean} {
    if (hasTwoFactor) return {permissions: granted, needsTwoFactor: false};
    // admin.sudo stands for every permission, so it still leaves the basic ones
    const held = granted.includes('admin.sudo') ? [...ALL_PERMISSIONS] : granted;
    return {
        permissions: held.filter(p => BASIC.has(p)),
        needsTwoFactor: held.some(p => !BASIC.has(p)),
    };
}
