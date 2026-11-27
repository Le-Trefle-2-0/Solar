/**
 * Client of the Solar API routes made for the bot (apps/api/src/routes/v1/botBridge.ts).
 * Authenticated with the bot account's API key (`token` header, never in the URL).
 */

export type PermanenceStatus =
    | {open: true; closesAt: string}
    | {open: false; nextOpening: {start: string; end: string} | null};

export type TicketRef = {ticketId: number; channelId: string; reference: string};
export type ActiveTicket = TicketRef & {discordUserId: string};
/** `replyToDiscordId`: the Discord message the volunteer answered, if any. */
export type PendingMessage = {id: number; content: string; timestamp: number; replyToDiscordId?: string | null};
/** Volunteers' reactions on a message, and the Discord message it is. */
export type ReactionState = {channelId: string; discordMessageId: string | null; emojis: string[]};

export type OpenResult =
    | {kind: 'opened'; ticket: TicketRef; waitingAhead: number}
    | {kind: 'already_open'; ticket: TicketRef}
    | {kind: 'permanence_closed'; nextOpening: {start: string; end: string} | null};

export type PostResult = 'saved' | 'duplicate' | 'ticket_closed';

export interface SolarApi {
    permanence(): Promise<PermanenceStatus>;
    /** Channels and message set in Solar's settings page (null fields: use the .env). */
    discordSettings(): Promise<{channels: Record<string, string | null>; publishOpeningMessage: boolean}>;
    /** The opening message the bot just posted (when asked to publish a new one). */
    reportOpeningMessage(messageId: string): Promise<void>;
    activeTickets(): Promise<ActiveTicket[]>;
    openTicket(discordUserId: string): Promise<OpenResult>;
    postUserMessage(channelId: string, discordMessageId: string, content: string, replyToDiscordId?: string | null): Promise<PostResult>;
    pending(channelId: string): Promise<PendingMessage[] | null>;
    /** `discordMessageId`: what the message became on Discord (for replies and reactions). */
    markRelayed(messageId: number, discordMessageId?: string): Promise<void>;
    /** The user reacted, or took a reaction back, on Discord. */
    userReaction(channelId: string, discordMessageId: string, emoji: string, added: boolean): Promise<void>;
    /** Null when the message is not in an open Discord écoute. */
    reactionState(messageId: number): Promise<ReactionState | null>;
    markUndelivered(messageId: number): Promise<void>;
    /** `withdraw`: the écoute could not start; Solar deletes it if nobody wrote in it. */
    close(channelId: string, withdraw?: boolean): Promise<boolean>;
}

export class SolarApiError extends Error {
    constructor(readonly status: number, readonly path: string) {
        super(`Solar API ${path} answered ${status}`);
    }
}

export function createSolarApi(baseUrl: string, apiKey: string, fetchImpl: typeof fetch = fetch): SolarApi {
    const base = baseUrl.replace(/\/$/, '');

    async function call(method: 'GET' | 'POST', path: string, body?: unknown): Promise<{status: number; data: any}> {
        const res = await fetchImpl(`${base}${path}`, {
            method,
            headers: {token: apiKey, ...(body !== undefined ? {'content-type': 'application/json'} : {})},
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(10_000),
        });
        const text = await res.text();
        let data: any = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = null;
        }
        return {status: res.status, data};
    }

    const ok = (r: {status: number}, path: string, accepted: number[] = [200, 201]) => {
        if (!accepted.includes(r.status)) throw new SolarApiError(r.status, path);
    };

    return {
        async permanence() {
            const r = await call('GET', '/v1/bot/permanence');
            ok(r, 'permanence');
            return r.data as PermanenceStatus;
        },
        async discordSettings() {
            const r = await call('GET', '/v1/bot/settings');
            ok(r, 'settings');
            return {channels: (r.data?.discord ?? {}) as Record<string, string | null>, publishOpeningMessage: r.data?.publishOpeningMessage === true};
        },
        async reportOpeningMessage(messageId) {
            ok(await call('POST', '/v1/bot/settings/opening-message', {messageId}), 'opening-message');
        },
        async activeTickets() {
            const r = await call('GET', '/v1/bot/tickets/active');
            ok(r, 'tickets/active');
            return (r.data?.tickets ?? []) as ActiveTicket[];
        },
        async openTicket(discordUserId) {
            const r = await call('POST', '/v1/bot/tickets', {discordUserId});
            if (r.status === 201) return {kind: 'opened', ticket: r.data.ticket, waitingAhead: r.data.waitingAhead ?? 0};
            if (r.status === 409) return {kind: 'already_open', ticket: r.data.ticket};
            if (r.status === 403 && r.data?.error === 'permanence_closed') {
                return {kind: 'permanence_closed', nextOpening: r.data.nextOpening ?? null};
            }
            throw new SolarApiError(r.status, 'tickets');
        },
        async postUserMessage(channelId, discordMessageId, content, replyToDiscordId) {
            const r = await call('POST', `/v1/bot/tickets/${encodeURIComponent(channelId)}/messages`, {
                discordMessageId, content, ...(replyToDiscordId ? {replyToDiscordId} : {}),
            });
            if (r.status === 404) return 'ticket_closed';
            ok(r, 'messages');
            return r.data?.duplicate ? 'duplicate' : 'saved';
        },
        async pending(channelId) {
            const r = await call('GET', `/v1/bot/tickets/${encodeURIComponent(channelId)}/pending`);
            if (r.status === 404) return null;
            ok(r, 'pending');
            return (r.data?.messages ?? []) as PendingMessage[];
        },
        async markRelayed(messageId, discordMessageId) {
            ok(await call('POST', `/v1/bot/messages/${messageId}/relayed`, discordMessageId ? {discordMessageId} : {}), 'relayed', [200, 404]);
        },
        async userReaction(channelId, discordMessageId, emoji, added) {
            // 404: the écoute is closed or the message unknown to Solar; 400: an emoji Solar cannot show
            ok(await call('POST', `/v1/bot/tickets/${encodeURIComponent(channelId)}/reactions`, {discordMessageId, emoji, added}), 'reactions', [200, 400, 404]);
        },
        async reactionState(messageId) {
            const r = await call('GET', `/v1/bot/messages/${messageId}/reactions`);
            if (r.status === 404) return null;
            ok(r, 'reactions');
            return r.data as ReactionState;
        },
        async markUndelivered(messageId) {
            ok(await call('POST', `/v1/bot/messages/${messageId}/undelivered`), 'undelivered', [200, 404]);
        },
        async close(channelId, withdraw = false) {
            const r = await call('POST', `/v1/bot/tickets/${encodeURIComponent(channelId)}/close`, withdraw ? {withdraw: true} : {});
            if (r.status === 404) return false;
            ok(r, 'close');
            return true;
        },
    };
}
