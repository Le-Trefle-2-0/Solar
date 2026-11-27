/**
 * A ticket as the volunteers' app may see it: never the requester's Discord id, even
 * pseudonymised, nor the raw metadata (#256). The bot gets the id through its own routes, and
 * the anonymity number (ticketInfo.ts) is what volunteers write down.
 */
export function publicTicket<T extends object>(ticket: T): Omit<T, 'discordUserID' | 'metadata'> {
    const {discordUserID: _id, metadata: _metadata, ...rest} = ticket as T & {discordUserID?: unknown; metadata?: unknown};
    return rest;
}
