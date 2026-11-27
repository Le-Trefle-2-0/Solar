import type {MessageCreateOptions} from 'discord.js';
import type {ActiveTicket, SolarApi} from './solar.js';
import {busy, dm, volunteerMessage, welcome, type Links} from './texts.js';

/**
 * The écoutes of Discord users, between their private messages and Solar. No Discord client
 * here (see index.ts), so the whole flow is tested with fakes.
 *
 * Nothing is stored by the bot: open écoutes come from Solar (resync), and volunteers' messages
 * are those Solar still lists as not delivered. A message is marked delivered once Discord
 * accepted it, so a restart or a lost connection never loses one; in the worst case (crash
 * between both) it is sent twice. Deliveries of one écoute are sent one after the other.
 */

/** `sent`: the id of the Discord message. */
export type DmResult = {sent: string} | 'unreachable';

export interface DiscordPort {
    /** 'unreachable' when the person closed their private messages or left Discord. */
    sendDm(userId: string, payload: MessageCreateOptions): Promise<DmResult>;
    typing(userId: string): Promise<void>;
    /** Makes the bot's own reactions on a private message exactly `emojis` (the volunteers' ones). */
    syncReactions(userId: string, messageId: string, emojis: string[]): Promise<void>;
}

export interface RoomsPort {
    /** Follow / stop following an écoute's events on the realtime service. */
    listen(channelId: string): void;
    leave(channelId: string): void;
}

/** `sent`: what Discord answered for each volunteer message, kept until Solar has recorded it. */
type Tracked = {ticketId: number; channelId: string; reference: string; discordUserId: string; sent: Map<number, DmResult>};

export type OpenOutcome =
    | {kind: 'opened'; reference: string}
    | {kind: 'already_open'}
    | {kind: 'permanence_closed'; nextOpening: {start: string; end: string} | null}
    | {kind: 'dm_closed'};

export type UserMessageOutcome = 'relayed' | 'no_ticket' | 'unsupported' | 'closed' | 'duplicate';

const TYPING_EVERY_MS = 8_000;

export class TicketRelay {
    private readonly byChannel = new Map<string, Tracked>();
    private readonly byUser = new Map<string, string>();
    private readonly queues = new Map<string, Promise<void>>();
    private readonly lastTyping = new Map<string, number>();

    constructor(
        private readonly api: SolarApi,
        private readonly discord: DiscordPort,
        private readonly rooms: RoomsPort,
        private readonly links: Links,
        private readonly log: Pick<Console, 'log' | 'warn' | 'error'> = console,
        private readonly now: () => number = Date.now,
    ) {
    }

    /** Écoute in progress for this Discord user, if any. */
    ticketOf(discordUserId: string) {
        const channelId = this.byUser.get(discordUserId);
        return channelId ? this.byChannel.get(channelId) ?? null : null;
    }

    get size() {
        return this.byChannel.size;
    }

    private track(t: ActiveTicket) {
        if (this.byChannel.has(t.channelId)) return;
        this.byChannel.set(t.channelId, {...t, sent: new Map()});
        this.byUser.set(t.discordUserId, t.channelId);
        this.rooms.listen(t.channelId);
    }

    private untrack(channelId: string) {
        const t = this.byChannel.get(channelId);
        if (!t) return null;
        this.byChannel.delete(channelId);
        if (this.byUser.get(t.discordUserId) === channelId) this.byUser.delete(t.discordUserId);
        this.rooms.leave(channelId);
        return t;
    }

    /**
     * Re-reads the open écoutes from Solar (start, reconnection, every minute) and sends what is
     * waiting. An écoute that disappeared meanwhile was closed in Solar while we were away.
     */
    async resync() {
        const active = await this.api.activeTickets();
        const open = new Set(active.map(t => t.channelId));
        for (const channelId of [...this.byChannel.keys()]) {
            if (!open.has(channelId)) await this.onTicketClosed(channelId, 'volunteer');
        }
        for (const t of active) this.track(t);
        // Re-follow every room: after a reconnection the realtime service forgot them
        for (const channelId of this.byChannel.keys()) this.rooms.listen(channelId);
        await Promise.all([...this.byChannel.keys()].map(channelId => this.flush(channelId)));
    }

    /** "Ouvrir une écoute": one per person, during a permanence, with private messages open. */
    async open(discordUserId: string): Promise<OpenOutcome> {
        const result = await this.api.openTicket(discordUserId);
        if (result.kind === 'permanence_closed') return result;
        if (result.kind === 'already_open') {
            this.track({...result.ticket, discordUserId});
            return {kind: 'already_open'};
        }

        const ticket = {...result.ticket, discordUserId};
        if (await this.discord.sendDm(discordUserId, welcome(ticket.reference, this.links)) === 'unreachable') {
            // Nobody could ever answer this person: the empty écoute is withdrawn
            await this.api.close(ticket.channelId, true);
            return {kind: 'dm_closed'};
        }
        this.track(ticket);
        this.log.log(`[bot] écoute ${ticket.reference} opened`);
        if (result.waitingAhead > 0) await this.discord.sendDm(discordUserId, busy());
        return {kind: 'opened', reference: ticket.reference};
    }

    /** "Fermer l'écoute" in the private messages. */
    async closeByUser(discordUserId: string): Promise<boolean> {
        const t = this.ticketOf(discordUserId);
        if (!t) return false;
        // Untracked first: the ticketClosed event that follows is ours
        this.untrack(t.channelId);
        await this.api.close(t.channelId);
        this.log.log(`[bot] écoute ${t.reference} closed by the user`);
        return true;
    }

    /** A private message of the user, possibly a reply to another one. Text only for now (images: #301). */
    async onUserMessage(
        discordUserId: string,
        message: {id: string; content: string; attachments: number; replyTo?: string | null},
    ): Promise<UserMessageOutcome> {
        const t = this.ticketOf(discordUserId);
        if (!t) return 'no_ticket';
        const content = message.content.trim();
        if (!content) return 'unsupported';
        const result = await this.api.postUserMessage(t.channelId, message.id, content.slice(0, 2000), message.replyTo ?? null);
        if (result === 'ticket_closed') {
            await this.onTicketClosed(t.channelId, 'volunteer');
            return 'closed';
        }
        if (result === 'duplicate') return 'duplicate';
        return message.attachments > 0 ? 'unsupported' : 'relayed';
    }

    /** The user reacted (or took a reaction back) on a message of their écoute. Unicode emojis only. */
    async onUserReaction(discordUserId: string, discordMessageId: string, emoji: string, added: boolean) {
        const t = this.ticketOf(discordUserId);
        if (!t) return;
        await this.api.userReaction(t.channelId, discordMessageId, emoji, added);
    }

    /**
     * A reaction changed in Solar: the bot's reactions on the Discord message follow the
     * volunteers' ones. Run after pending deliveries, so a message reacted to right after being
     * sent already has its Discord id.
     */
    async onSolarReaction(messageId: number | undefined) {
        if (!Number.isInteger(messageId) || !this.byChannel.size) return;
        await Promise.all([...this.queues.values()]);
        const state = await this.api.reactionState(messageId!).catch(() => null);
        const t = state && this.byChannel.get(state.channelId);
        if (!t || !state.discordMessageId) return;
        const discordMessageId = state.discordMessageId;
        await this.enqueue(state.channelId, () => this.discord.syncReactions(t.discordUserId, discordMessageId, state.emojis));
    }

    /** The user is typing: shown in Solar (sent by index.ts on the realtime service). */
    userTyping(discordUserId: string) {
        return this.ticketOf(discordUserId)?.channelId ?? null;
    }

    /** A message was posted in an écoute's room: volunteers' ones are sent to the user. */
    async onSolarMessage(channelId: string, authorId: string | undefined) {
        if (!this.byChannel.has(channelId) || !authorId || authorId === 'guest') return;
        await this.flush(channelId);
    }

    async onVolunteerTyping(channelId: string, authorId: string | undefined) {
        const t = this.byChannel.get(channelId);
        if (!t || authorId === 'guest') return;
        const last = this.lastTyping.get(channelId) ?? 0;
        if (this.now() - last < TYPING_EVERY_MS) return;
        this.lastTyping.set(channelId, this.now());
        await this.discord.typing(t.discordUserId).catch(() => undefined);
    }

    async onTicketClosed(channelId: string, closedBy: string | undefined) {
        const t = this.untrack(channelId);
        if (!t) return;
        this.lastTyping.delete(channelId);
        this.log.log(`[bot] écoute ${t.reference} closed in Solar`);
        if (closedBy !== 'user') await this.discord.sendDm(t.discordUserId, dm.closedByVolunteer()).catch(() => undefined);
    }

    async onVoiceInvite(channelId: string, url: string, expiresAt: number) {
        const t = this.byChannel.get(channelId);
        if (!t) return;
        await this.discord.sendDm(t.discordUserId, dm.voiceInvite(url, expiresAt));
    }

    /** Sends the volunteers' messages Solar has not seen delivered, in order, one écoute at a time. */
    flush(channelId: string): Promise<void> {
        return this.enqueue(channelId, () => this.deliver(channelId), 'delivery postponed');
    }

    /** Discord actions of one écoute run one after the other. */
    private enqueue(channelId: string, task: () => Promise<void>, failure = 'reaction not shown on Discord'): Promise<void> {
        const previous = this.queues.get(channelId) ?? Promise.resolve();
        const next = previous.then(task).catch(e => {
            this.log.warn(`[bot] ${failure}: ${(e as Error).message}`);
        });
        this.queues.set(channelId, next);
        void next.finally(() => {
            if (this.queues.get(channelId) === next) this.queues.delete(channelId);
        });
        return next;
    }

    private async deliver(channelId: string) {
        const t = this.byChannel.get(channelId);
        if (!t) return;
        const pending = await this.api.pending(channelId);
        if (pending === null) {
            await this.onTicketClosed(channelId, 'volunteer');
            return;
        }
        for (const m of pending) {
            // Already sent, but Solar did not record it (it was unreachable): record it, never resend
            let result = t.sent.get(m.id);
            if (!result) {
                // A Discord outage throws here: the rest waits for the next attempt
                const payload = volunteerMessage(m.content, t.reference, m.timestamp);
                // An answer to a given message shows as a reply on Discord too
                if (m.replyToDiscordId) payload.reply = {messageReference: m.replyToDiscordId, failIfNotExists: false};
                result = await this.discord.sendDm(t.discordUserId, payload);
                t.sent.set(m.id, result);
                if (result === 'unreachable') this.log.warn(`[bot] écoute ${t.reference}: message not delivered (private messages closed)`);
            }
            if (result === 'unreachable') await this.api.markUndelivered(m.id);
            else await this.api.markRelayed(m.id, result.sent);
            t.sent.delete(m.id);
        }
    }
}
