const MAX_BYTES = 10 * 1024 * 1024;

/** Accepted inline formats, recognised by their first bytes. SVG is excluded: it can carry scripts. */
const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
    png: b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    jpeg: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
    gif: b => /^GIF8[79]a/.test(b.toString('latin1', 0, 6)),
    webp: b => b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP',
};

/** An uploaded image (base64 data URL), or an https URL on a host listed in IMAGE_ALLOWED_HOSTS. */
export function isAllowedImage(value: string): boolean {
    const data = /^data:image\/(png|jpeg|gif|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (data) {
        const bytes = Buffer.from(data[2], 'base64');
        return bytes.length <= MAX_BYTES && SIGNATURES[data[1]](bytes);
    }

    let url: URL;
    try {
        url = new URL(value);
    } catch {
        return false;
    }
    const hosts = (process.env.IMAGE_ALLOWED_HOSTS || '').split(',').map(h => h.trim().toLowerCase()).filter(Boolean);
    return url.protocol === 'https:' && !url.username && !url.password && !/["'<>\s]/.test(value)
        && hosts.includes(url.hostname);
}
