/**
 * What a visitor's widget may receive (#255, #257). Visitors share the écoute's room with the
 * volunteers, but never learn who they are: authors, typing indicators and reactions of the
 * team become "Bénévole Écoutant", with no id, avatar or role. Presence events are not sent.
 */

export const STAFF_ALIAS = Object.freeze({id: 'staff', name: 'Bénévole Écoutant', username: 'Bénévole Écoutant', image: null, role: null});

/** Events about who is in a channel: never for visitors. */
const TEAM_ONLY_EVENTS = new Set(['userJoined', 'userLeft', 'userOnline', 'userOffline', 'presenceUpdate', 'spectateUpdate']);

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Kept as is for the visitor's own messages, replaced for anyone else. */
function person(value: unknown, visitorId: string): unknown {
    if (!isObject(value)) return value;
    const id = value.id;
    if (id === visitorId || id === 'guest') return {id, name: 'Utilisateur', image: null, role: null};
    return {...STAFF_ALIAS};
}

/** The event as the visitor sees it, or null when it must not be sent. */
export function visitorView(event: string, data: unknown, visitorId: string): unknown | null {
    if (TEAM_ONLY_EVENTS.has(event)) return null;
    if (!isObject(data)) return data;
    // Team notes never reach the visitor, whatever the route that sent them
    if (data.internal === true) return null;
    const out: Record<string, unknown> = {...data};
    if ('author' in out) out.author = person(out.author, visitorId);
    if ('user' in out) out.user = person(out.user, visitorId);
    if (isObject(out.reaction)) out.reaction = {...out.reaction, userID: null};
    if (Array.isArray(out.reactions)) out.reactions = out.reactions.map(r => (isObject(r) ? {...r, userID: null} : r));
    return out;
}
