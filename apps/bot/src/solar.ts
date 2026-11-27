/**
 * Client of the Solar API routes made for the bot (apps/api/src/routes/v1/botBridge.ts).
 * Authenticated with the bot account's API key (`token` header, never in the URL).
 */

export type PermanenceStatus =
    | {open: true; closesAt: string}
    | {open: false; nextOpening: {start: string; end: string} | null};

export type TicketRef = {ticketId: number; channelId: string; reference: string};
export type ActiveTicket = TicketRef & {discordUserId: string};
export type PendingMessage = {id: number; content: string; timestamp: number};

export type OpenResult =
    | {kind: 'opened'; ticket: TicketRef; waitingAhead: number}
    | {kind: 'already_open'; ticket: TicketRef}
    | {kind: 'permanence_closed'; nextOpening: {start: string; end: string} | null};

export type PostResult = 'saved' | 'duplicate' | 'ticket_closed';

export interface SolarApi {
    permanence(): Promise<PermanenceStatus>;
    activeTickets(): Promise<ActiveTicket[]>;
    openTicket(discordUserId: string): Promise<OpenResult>;
    postUserMessage(channelId: string, discordMessageId: string, content: string): Promise<PostResult>;
    pending(channelId: string): Promise<PendingMessage[] | null>;
    markRelayed(messageId: number): Promise<void>;
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
        async postUserMessage(channelId, discordMessageId, content) {
            const r = await call('POST', `/v1/bot/tickets/${encodeURIComponent(channelId)}/messages`, {discordMessageId, content});
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
        async markRelayed(messageId) {
            ok(await call('POST', `/v1/bot/messages/${messageId}/relayed`), 'relayed', [200, 404]);
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
