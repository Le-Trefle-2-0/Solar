/**
 * Escaping of user-provided text placed in e-mails and Discord messages (#222, #265, #273):
 * names, subjects, messages and application answers are shown as text, never as markup.
 */

const HTML_ENTITIES: Record<string, string> = {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"};

/** Text to put in HTML (content or attribute). Line breaks become <br> when `lineBreaks` is set. */
export function escapeHtml(value: unknown, {lineBreaks = false}: { lineBreaks?: boolean } = {}): string {
    const escaped = String(value ?? "").replace(/[&<>"']/g, c => HTML_ENTITIES[c]);
    return lineBreaks ? escaped.replace(/\r?\n/g, "<br>") : escaped;
}

/**
 * Text to put in a Discord message: Markdown, mentions (@everyone, <@id>) and links are shown
 * as typed. Discord also gets `allowed_mentions: {parse: []}`, which this does not replace.
 */
export function escapeDiscord(value: unknown): string {
    return String(value ?? "")
        .replace(/[\\*_~`|>#\-\[\]()]/g, c => `\\${c}`)
        // A zero-width space keeps "@everyone" or "<@123>" from being read as a mention
        .replace(/@/g, "@​")
        .replace(/<(?=[@#:a])/g, "<​");
}

/** An e-mail subject: one line, no control characters, bounded. */
export function emailSubject(value: string, max = 150): string {
    return value.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max);
}
