import {prisma} from '../prisma.js';

/**
 * The website widget's on/off switch (admin settings, "widget_enabled"). Turned off, the widget is
 * not only hidden: every public widget route refuses, so no écoute can be opened, resumed or written
 * in through the API either.
 */

export const WIDGET_ENABLED_KEY = 'widget_enabled';

/**
 * The switch is read at most once per CACHE_MS: it is checked before the per-IP rate limits, on
 * every widget path (unknown ones included), so it must not cost a query per request. Saved
 * through the settings route it applies at once; changed any other way, within that delay.
 */
const CACHE_MS = 5_000;
let cached: {value: Promise<boolean>; at: number} | null = null;

/** Called when the switch is saved through the API: this instance applies it at once. */
export function forgetWidgetSwitch() {
    cached = null;
}

/** On unless explicitly turned off, as in the settings page. */
export function isWidgetEnabled(now = Date.now()): Promise<boolean> {
    if (!cached || now - cached.at >= CACHE_MS) {
        const value = prisma.settings.findUnique({where: {key: WIDGET_ENABLED_KEY}})
            .then(setting => setting?.value !== 'false');
        cached = {value, at: now};
        // A failed read is not kept: the next request tries again
        value.catch(() => {
            if (cached?.value === value) cached = null;
        });
    }
    return cached.value;
}

/** The routes a visitor of the website uses: opening, resuming, writing, closing, voice and realtime access. */
export function isWidgetRoute(url: string): boolean {
    const path = url.split('?')[0];
    return path.startsWith('/v1/widget/') || path.startsWith('/v1/messages/widget/') || path === '/v1/ws/guest';
}

/**
 * What a widget route answers while the widget is off. The
 * availability route still answers, closed, so the widget can explain why nobody can be reached.
 */
export function widgetOffResponse(url: string): {status: number; body: Record<string, unknown>} {
    if (url.split('?')[0] === '/v1/widget/availability') {
        return {status: 200, body: {open: false, nextOpening: null, disabled: true}};
    }
    return {status: 403, body: {success: false, error: 'widget_disabled'}};
}
