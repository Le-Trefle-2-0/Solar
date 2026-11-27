/** Two years, plus the leap day and the hours of the end day. */
const MAX_RANGE_DAYS = 732;
const INTERVALS = ['day', 'week', 'month'] as const;

export type StatsRange = {startDate: Date; endDate: Date; interval: typeof INTERVALS[number]};

/** Bounds the period of GET /v1/admin/stats: its time series loops over every step of it. */
export function parseStatsRange(
    {start, end, interval = 'day'}: {start?: string; end?: string; interval?: string},
    now = new Date(),
): StatsRange | {error: string} {
    const startDate = start ? new Date(start) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = end ? new Date(end) : now;

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return {error: 'invalid_date'};
    if (!(INTERVALS as readonly string[]).includes(interval)) return {error: 'invalid_interval'};
    if (endDate < startDate) return {error: 'end_before_start'};
    if (endDate.getTime() - startDate.getTime() > MAX_RANGE_DAYS * 86_400_000) return {error: 'range_too_large'};

    return {startDate, endDate, interval: interval as StatsRange['interval']};
}
