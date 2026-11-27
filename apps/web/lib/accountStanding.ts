/**
 * Whether an account may still act (#247, #249). Same rules as apps/api/src/lib/accountStanding.ts:
 * banned or closed accounts are refused; accounts whose identity documents are missing or refused
 * are refused too (renewal: 14 days), except account managers, the owner and the bot account.
 * The document dialog and the document upload only need the session, not this check.
 */

export type Standing = {
    banned?: boolean | null;
    banExpires?: Date | null;
    documentsStatus?: string | null;
    documentsRenewalAt?: Date | null;
};

export const STANDING_SELECT = {banned: true, banExpires: true, documentsStatus: true, documentsRenewalAt: true} as const;

export const RENEWAL_GRACE_DAYS = 14;

export function isBanned(user: Standing, now = new Date()): boolean {
    return !!user.banned && (!user.banExpires || user.banExpires > now);
}

export function documentsBlocked(user: Standing, now = new Date()): boolean {
    if (user.documentsStatus !== "missing" && user.documentsStatus !== "rejected") return false;
    if (user.documentsStatus === "rejected" || !user.documentsRenewalAt) return true;
    return now.getTime() - user.documentsRenewalAt.getTime() >= RENEWAL_GRACE_DAYS * 24 * 3600_000;
}

export const isBotAccount = (userId: string) => userId.startsWith("bot_");
