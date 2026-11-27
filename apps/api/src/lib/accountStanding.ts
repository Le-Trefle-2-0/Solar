/**
 * Whether an account may still act (#247, #249). Same rules as apps/web/lib/accountStanding.ts.
 *
 * - Banned (or closed) accounts are refused everywhere: API, WebSocket, voice.
 * - Accounts whose identity documents are missing or refused hold no permission until they are
 *   sent again, as the document dialog of the app already shows: a document renewal leaves
 *   14 days. Account managers, the owner and the bot account are not concerned.
 */

export type Standing = {
    banned?: boolean | null;
    banExpires?: Date | null;
    documentsStatus?: string | null;
    documentsRenewalAt?: Date | null;
    twoFactorEnabled?: boolean | null;
};

export const STANDING_SELECT = {banned: true, banExpires: true, documentsStatus: true, documentsRenewalAt: true, twoFactorEnabled: true} as const;

export const RENEWAL_GRACE_DAYS = 14;

export function isBanned(user: Standing, now = new Date()): boolean {
    return !!user.banned && (!user.banExpires || user.banExpires > now);
}

export function documentsBlocked(user: Standing, now = new Date()): boolean {
    if (user.documentsStatus !== 'missing' && user.documentsStatus !== 'rejected') return false;
    if (user.documentsStatus === 'rejected' || !user.documentsRenewalAt) return true;
    return now.getTime() - user.documentsRenewalAt.getTime() >= RENEWAL_GRACE_DAYS * 24 * 3600_000;
}

/** The technical account of the Discord bot is recognised by its id (see POST /v1/bot/setup/account). */
export const isBotAccount = (userId: string) => userId.startsWith('bot_');
