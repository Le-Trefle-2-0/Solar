import {resolveActor} from './permissions.js';
import {isBotAccount} from './accountStanding.js';

/**
 * Who receives an internal newsletter (#263): subscribed accounts still part of the team, i.e.
 * neither banned, closed nor blocked (same rules as signing in to Solar) and holding at least one
 * permission. Self-registered or role-less accounts and the bot never do.
 */
export function internalRecipients<U extends Parameters<typeof resolveActor>[0] & {email: string}>(
    users: U[],
    ownerId: string | null,
    roleRows: {name: string; permissions: string}[],
): {id: string; email: string}[] {
    return users.flatMap(u => {
        if (isBotAccount(u.id)) return [];
        const actor = resolveActor(u, ownerId, roleRows);
        return actor && actor.permissions.length > 0 ? [{id: u.id, email: u.email}] : [];
    });
}
