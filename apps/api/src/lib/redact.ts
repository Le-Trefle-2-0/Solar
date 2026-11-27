/** Removes credentials from a URL before it is logged. */
export function redactUrl(url: string): string {
    return url.replace(/([?&](?:token|key|jwt|secret|password)=)[^&]*/gi, '$1[redacted]');
}
