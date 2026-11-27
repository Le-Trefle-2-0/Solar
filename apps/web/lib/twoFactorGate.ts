import {ALL_PERMISSIONS} from "./permissions";

/**
 * Two-factor authentication is required for every privileged permission (#17). Without it, an
 * account only keeps what a listening volunteer (or one in training) needs. Anything not listed
 * here is privileged. Same rules as apps/api/src/lib/twoFactorGate.ts.
 */
export const BASIC_PERMISSIONS: readonly string[] = [
    "tickets.send_message", "tickets.close", "tickets.transmission", "tickets.launch_voice", "tickets.spectate",
    "permanence.register", "permanence.unregister",
];

const BASIC = new Set(BASIC_PERMISSIONS);

export function applyTwoFactorGate(granted: string[], hasTwoFactor: boolean)
    : {permissions: string[]; needsTwoFactor: boolean} {
    if (hasTwoFactor) return {permissions: granted, needsTwoFactor: false};
    // admin.sudo stands for every permission, so it still leaves the basic ones
    const held: string[] = granted.includes("admin.sudo") ? [...ALL_PERMISSIONS] : granted;
    return {
        permissions: held.filter(p => BASIC.has(p)),
        needsTwoFactor: held.some(p => !BASIC.has(p)),
    };
}
