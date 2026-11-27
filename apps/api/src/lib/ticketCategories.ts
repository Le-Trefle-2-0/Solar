/**
 * Categories offered in transmissions: those set in the settings, always followed by "Autres",
 * so an écoute that fits none of them can still be reported.
 */

export const OTHER_CATEGORY = 'Autres';

const isOther = (c: string) => ['autre', 'autres'].includes(c.trim().toLowerCase());

export function withOtherCategory(categories: unknown): string[] {
    const list = Array.isArray(categories) ? categories.filter((c): c is string => typeof c === 'string' && !!c.trim()) : [];
    return [...list.filter(c => !isOther(c)), OTHER_CATEGORY];
}
