/**
 * The client's address behind the reverse proxy (Traefik). The proxy appends the address it saw
 * to X-Forwarded-For, after whatever the client sent: only the right end of the list can be
 * trusted. TRUSTED_PROXIES lists the proxies' own addresses (comma separated, CIDR accepted by
 * Better Auth; exact addresses here), skipped from the right. Default: a proxy on this machine.
 */
export const TRUSTED_PROXIES: string[] = (process.env.TRUSTED_PROXIES ?? "127.0.0.1,::1")
    .split(",").map(s => s.trim()).filter(Boolean);

const stripPrefix = (cidr: string) => cidr.split("/")[0];

/** Rightmost address of X-Forwarded-For that is not one of our proxies; null when there is none. */
export function clientAddressFromForwarded(value: string | null | undefined, trusted = TRUSTED_PROXIES): string | null {
    const hops = (value ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const proxies = new Set(trusted.map(stripPrefix));
    for (let i = hops.length - 1; i >= 0; i--) {
        const hop = hops[i].replace(/^::ffff:/, "");
        if (!proxies.has(hop)) return hop;
    }
    return null;
}
