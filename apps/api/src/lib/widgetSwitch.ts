import {prisma} from '../prisma.js';

/**
 * The website widget's on/off switch (admin settings, "widget_enabled"). Turned off, the widget is
 * not only hidden: every public widget route refuses, so no écoute can be opened, resumed or written
 * in through the API either.
 */

export const WIDGET_ENABLED_KEY = 'widget_enabled';

/** On unless explicitly turned off, as in the settings page. */
export async function isWidgetEnabled(): Promise<boolean> {
    const setting = await prisma.settings.findUnique({where: {key: WIDGET_ENABLED_KEY}});
    return setting?.value !== 'false';
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
