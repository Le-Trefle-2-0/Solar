/**
 * Per-address limit on password reset e-mails (#252): the reset form can be filled in by anyone,
 * so without it an address could be flooded from the association's domain. In memory, like
 * Better Auth's own limiter (one web instance).
 */

const WINDOW_MS = 60 * 60 * 1000;
export const MAX_RESET_EMAILS_PER_HOUR = 3;

const sent = new Map<string, number[]>();

export function allowResetEmail(email: string, now = Date.now()): boolean {
    const key = email.trim().toLowerCase();
    const recent = (sent.get(key) ?? []).filter(t => now - t < WINDOW_MS);
    if (recent.length >= MAX_RESET_EMAILS_PER_HOUR) {
        sent.set(key, recent);
        return false;
    }
    recent.push(now);
    sent.set(key, recent);
    // Keep the map small: forget addresses with nothing recent
    if (sent.size > 10_000) {
        for (const [k, times] of sent) if (times.every(t => now - t >= WINDOW_MS)) sent.delete(k);
    }
    return true;
}
