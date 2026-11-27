/**
 * An écoute is written in while it waits for a volunteer or is in progress. Once closed (report
 * to write, archived) its transcript is final: no new message, edit, deletion or reaction, from
 * the visitor, the volunteer or anyone else (#266). Same rule in apps/web/lib/messageManager.ts.
 */
export const WRITABLE_TICKET_STATUSES = ['waiting', 'started'];

/** No ticket (shared or permanence channel): writable, the channel rules decide. */
export const isTicketWritable = (ticket: {statusName: string} | null | undefined) =>
    !ticket || WRITABLE_TICKET_STATUSES.includes(ticket.statusName);
