/**
 * Neutralises markup in message content. An HTML parser only opens a tag when "<" is directly
 * followed by a letter, "/", "!" or "?": a zero-width space in between turns it into plain text.
 * Nothing is removed or entity-encoded, so "<3" or "a < b" are untouched and the text still
 * reads the same where it is already escaped (React, Discord). Applying it twice changes nothing.
 */
export function neutralizeHtml(content: string): string {
    return content.replace(/<(?=[a-zA-Z!/?])/g, '<\u200B');
}
