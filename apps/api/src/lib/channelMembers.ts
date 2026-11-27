import {prisma} from '../prisma.js';
import {getOwnerId, resolveActor} from './permissions.js';
import {canReadChannel} from './channelAccess.js';
import {STANDING_SELECT, isBotAccount} from './accountStanding.js';

/**
 * The member list of a channel: every account that may read it, with the same rules as the
 * API (banned, closed and blocked accounts excluded, owner, roles) and as reading the channel
 * itself. The bot account is not a member.
 */

export type MemberRow = {
    id: string;
    name: string;
    username: string | null;
    displayUsername: string | null;
    image: string | null;
    role: string | null;
} & Parameters<typeof resolveActor>[0];

export type Member = {id: string; username: string; image: string | null; role: string | null};

export function membersWhoCanRead(
    users: MemberRow[],
    channel: {channelId: string; assignedUserId: string | null; isPermanence: boolean; spectatorIds?: string[]},
    ownerId: string | null,
    roleRows: {name: string; permissions: string}[],
): Member[] {
    return users.flatMap(u => {
        if (isBotAccount(u.id)) return [];
        const actor = resolveActor(u, ownerId, roleRows);
        if (!actor || !canReadChannel({...channel, userId: u.id, permissions: actor.permissions})) return [];
        return [{id: u.id, username: u.displayUsername || u.name || u.username || 'Utilisateur', image: u.image, role: u.role}];
    });
}

export async function channelMembers(channel: {channelId: string; assignedUserId: string | null; isPermanence: boolean; spectatorIds?: string[]}): Promise<Member[]> {
    const [users, roleRows, ownerId] = await Promise.all([
        prisma.user.findMany({
            select: {id: true, name: true, username: true, displayUsername: true, image: true, role: true, ...STANDING_SELECT},
        }),
        prisma.role.findMany({select: {name: true, permissions: true}}),
        getOwnerId(),
    ]);
    return membersWhoCanRead(users, channel, ownerId, roleRows);
}
