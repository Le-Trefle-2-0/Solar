import {format} from "date-fns";

/**
 * Planning helpers for the interface. The API applies the same rules to every action
 * (apps/api/src/lib/planningRules.ts); these only decide which controls to show.
 */

export type SlotPart = 'first' | 'second';

/** Hours covered by a part: the first half or the second half of the permanence. */
export function partHours(start: Date, end: Date, part: SlotPart): string {
    const middle = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
    const [from, to] = part === 'first' ? [start, middle] : [middle, end];
    return `${format(from, "HH'h'mm")}-${format(to, "HH'h'mm")}`;
}

/** register_other_user / unregister_other_user only on slots of a role you hold; _all on any slot. */
export function canActOnOthers(can: (permission: string) => boolean, myRoles: string[], slotRole: string,
                               action: 'register' | 'unregister'): boolean {
    return can(`permanence.${action}_other_all`) || (can(`permanence.${action}_other_user`) && myRoles.includes(slotRole));
}

export const splitRoles = (roles: string | null | undefined) =>
    (roles || '').split(',').map(r => r.trim()).filter(Boolean);
