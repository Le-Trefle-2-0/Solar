import {pseudonymize, upgradeLegacyHash} from './pseudonym.js';

/**
 * The person behind an écoute, without their Discord id: the keyed hash Solar stores once an
 * écoute is closed (pseudonym.ts). It is the same for every écoute of that person, so
 * vigilances and the 30-day rule follow them, and it gives the anonymity number used in
 * reports.
 */

export function requesterHash(stored: string): string {
    if (stored.startsWith('h1:')) return stored;
    return upgradeLegacyHash(stored) ?? pseudonymize(stored);
}

/** Short, stable and readable form of the hash, e.g. 277D-D0A1-9F3C (48 bits). */
export function anonymityNumber(hash: string): string {
    const hex = hash.replace(/^h1:/, '').slice(0, 12).toUpperCase();
    return hex.match(/.{1,4}/g)!.join('-');
}

const DISCORD_ID = /^\d{15,22}$/;

/** The Discord id is known only while the écoute is open (it is replaced by the hash on closing). */
export function revealableDiscordId(ticket: {source: string | null; statusName: string; discordUserID: string}): string | null {
    if (ticket.source !== 'discord' || !['waiting', 'started'].includes(ticket.statusName)) return null;
    return DISCORD_ID.test(ticket.discordUserID) ? ticket.discordUserID : null;
}

/** A volunteer takes the same person in charge at most once every 30 days, text or voice. */
export const ELIGIBILITY_WINDOW_DAYS = 30;
