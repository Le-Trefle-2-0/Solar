/**
 * Same as apps/api/src/lib/sanitize.ts (keep both in sync).
 *
 * Neutralises markup in message content. An HTML parser only opens a tag when "<" is directly
 * followed by a letter, "/", "!" or "?": a zero-width space in between turns it into plain text.
 * Nothing is removed or entity-encoded, so "<3" or "a < b" are untouched. Applying it twice
 * changes nothing.
 */
export function neutralizeHtml(content: string): string {
    return content.replace(/<(?=[a-zA-Z!/?])/g, '<​');
}
