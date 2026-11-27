import {headers} from "next/headers";

/**
 * Per-visitor limits for the public forms of the site (contact, applications, waiting lists,
 * newsletter, #223; donations, #280). Server actions are plain POST endpoints anyone can call in a loop: without
 * this they cost e-mails and AI calls. In memory (one web instance), keyed by client address.
 */

type Rule = {max: number; windowMs: number};

const HOUR = 60 * 60 * 1000;

export const PUBLIC_ACTION_RULES = {
    contact: {max: 5, windowMs: HOUR},
    application: {max: 5, windowMs: HOUR},
    waitlist: {max: 10, windowMs: HOUR},
    newsletter: {max: 10, windowMs: HOUR},
    // Each one asks HelloAsso for a checkout (#280)
    donation: {max: 10, windowMs: HOUR},
} satisfies Record<string, Rule>;

export type PublicAction = keyof typeof PUBLIC_ACTION_RULES;

const hits = new Map<string, number[]>();

/** Pure part, tested on its own. */
export function takeToken(key: string, rule: Rule, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter(t => now - t < rule.windowMs);
    const allowed = recent.length < rule.max;
    if (allowed) recent.push(now);
    hits.set(key, recent);
    if (hits.size > 50_000) {
        for (const [k, times] of hits) if (!times.some(t => now - t < HOUR)) hits.delete(k);
    }
    return allowed;
}

/** The client address as the reverse proxy reports it (first hop of X-Forwarded-For). */
async function clientAddress(): Promise<string> {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwarded || h.get("x-real-ip") || "unknown";
}

/** False when this visitor sent too many of these forms recently. */
export async function allowPublicAction(action: PublicAction): Promise<boolean> {
    return takeToken(`${action}:${await clientAddress()}`, PUBLIC_ACTION_RULES[action]);
}

export const TOO_MANY_REQUESTS = "Trop de demandes envoyées. Réessayez dans un moment.";
