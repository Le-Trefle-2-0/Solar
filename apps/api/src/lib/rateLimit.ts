import {isInternal} from './internalAuth.js';

/** Applies to every route, per client IP. Our own services are exempt. */
export const GLOBAL_RATE_LIMIT = {global: true, max: 600, timeWindow: '1 minute', allowList: isInternal};

/** Route option for a tighter, per-route limit. */
export const limitPerMinute = (max: number) => ({config: {rateLimit: {max, timeWindow: '1 minute'}}});

/** TRUST_PROXY: "true", a number of hops, or a list of proxy addresses. Unset: trust none. */
export function trustProxySetting(value = process.env.TRUST_PROXY): boolean | number | string {
    if (!value || value === 'false') return false;
    if (value === 'true') return true;
    return /^\d+$/.test(value) ? Number(value) : value;
}
