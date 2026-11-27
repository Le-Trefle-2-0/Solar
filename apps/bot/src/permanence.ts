import type {PermanenceStatus, SolarApi} from './solar.js';
import type {NextOpening} from './texts.js';

/**
 * Opening and closing follow Solar's planning (#300): the permanence is open while a planning
 * event runs, as for the website's widget. This replaces the former bot's manual "Commencer une
 * permanence" / "Fin de la permanence" buttons and its date picker: the referents plan
 * permanences in Solar. Checked every minute, and right at the expected opening or closing time.
 */

export type PermanenceView = {open: boolean; next: NextOpening; closesAt: string | null};

export const POLL_MS = 60_000;

export function viewOf(status: PermanenceStatus): PermanenceView {
    return status.open
        ? {open: true, next: null, closesAt: status.closesAt}
        : {open: false, next: status.nextOpening, closesAt: null};
}

/** Whether what Discord shows has to change. */
export function changed(previous: PermanenceView | null, next: PermanenceView): boolean {
    return !previous || previous.open !== next.open || (previous.next?.start ?? null) !== (next.next?.start ?? null);
}

/** Next check: at the next expected change if it comes before the regular poll. */
export function nextCheckDelay(view: PermanenceView, now: number): number {
    const boundary = view.open ? view.closesAt : view.next?.start;
    if (!boundary) return POLL_MS;
    const until = new Date(boundary).getTime() - now + 1_000;
    return Math.max(1_000, Math.min(POLL_MS, until));
}

export type ApplyPermanence = (view: PermanenceView, transition: {opened: boolean}) => Promise<void>;

export class PermanenceWatcher {
    private current: PermanenceView | null = null;
    private timer: NodeJS.Timeout | null = null;
    private stopped = false;

    constructor(
        private readonly api: Pick<SolarApi, 'permanence'>,
        private readonly apply: ApplyPermanence,
        private readonly log: Pick<Console, 'log' | 'warn'> = console,
        private readonly now: () => number = Date.now,
    ) {
    }

    get view() {
        return this.current;
    }

    start() {
        this.stopped = false;
        void this.tick();
    }

    stop() {
        this.stopped = true;
        if (this.timer) clearTimeout(this.timer);
    }

    /** Checks Solar now; applies only on change, unless `force` (after a reconnection). */
    async tick(force = false) {
        if (this.timer) clearTimeout(this.timer);
        let delay = POLL_MS;
        try {
            const view = viewOf(await this.api.permanence());
            if (force || changed(this.current, view)) {
                // An opening seen while running (not at start-up) is announced, like the former bot did
                const opened = !!this.current && !this.current.open && view.open;
                await this.apply(view, {opened});
                if (!this.current || this.current.open !== view.open) {
                    this.log.log(`[bot] permanence ${view.open ? 'open' : 'closed'}`);
                }
            }
            this.current = view;
            delay = nextCheckDelay(view, this.now());
        } catch (e) {
            this.log.warn(`[bot] permanence check failed: ${(e as Error).message}`);
        }
        if (!this.stopped) this.timer = setTimeout(() => void this.tick(), delay);
    }
}
