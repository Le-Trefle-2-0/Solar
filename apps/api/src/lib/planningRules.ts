import {hasPermission} from './roleAssignment.js';

/**
 * Planning rules shared by the events routes (pure functions, tested on their own).
 *
 * Permissions on someone else's registration:
 * - `permanence.register_other_user` / `permanence.unregister_other_user`: for peers, that is
 *   on slots of a role the person acting holds themselves;
 * - `permanence.register_other_all` / `permanence.unregister_other_all`: on any slot.
 * The registered person must always hold the slot's role.
 */

export const PLANNING_TIME_ZONE = 'Europe/Paris';

export type PlanningActor = {id: string; roles: string[]; permissions: string[]};

export function canActOnOthers(actor: PlanningActor, slotRole: string, action: 'register' | 'unregister'): boolean {
    if (hasPermission(actor.permissions, `permanence.${action}_other_all`)) return true;
    return hasPermission(actor.permissions, `permanence.${action}_other_user`) && actor.roles.includes(slotRole);
}

/** Wall-clock parts of `date` in `timeZone`. */
function zonedParts(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone, hourCycle: 'h23', weekday: 'short',
        year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
    }).formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)!.value;
    return {
        year: Number(get('year')), month: Number(get('month')), day: Number(get('day')),
        hour: Number(get('hour')), minute: Number(get('minute')), second: Number(get('second')),
        weekday: get('weekday'),
    };
}

/** The instant at which the clocks of `timeZone` show this date and time. */
function zonedTimeToInstant(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
    const wanted = Date.UTC(year, month - 1, day, hour, minute);
    const offsetAt = (ts: number) => {
        const p = zonedParts(new Date(ts), timeZone);
        return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ts;
    };
    let ts = wanted - offsetAt(wanted);
    ts = wanted - offsetAt(ts); // settles around daylight saving time changes
    return new Date(ts);
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Registrations made after this become requests a manager approves, and volunteers can no longer
 * unregister themselves: Monday 12:00 (Paris time) of the week of the event, whatever the
 * server's time zone.
 */
export function registrationDeadline(eventStart: Date, timeZone = PLANNING_TIME_ZONE): Date {
    const p = zonedParts(eventStart, timeZone);
    const monday = new Date(Date.UTC(p.year, p.month - 1, p.day - WEEKDAYS.indexOf(p.weekday)));
    return zonedTimeToInstant(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate(), 12, 0, timeZone);
}

export type SlotEdit = {id?: string; role: string; goalCount: number; part?: 'first' | 'second' | null};
export type ExistingSlot = {id: string; role: string; part: string | null; registrations: number};

/**
 * What an edit does to the slots of an event: slots sent with an id are updated, without one
 * are created, and slots left out are deleted along with their registrations. A slot that has
 * registrations keeps its role and part, so nobody ends up on a slot they could not take.
 */
export function planSlotChanges(existing: ExistingSlot[], wanted: SlotEdit[]):
    {error: string} | {create: SlotEdit[]; update: (SlotEdit & {id: string})[]; remove: string[]} {
    if (!wanted.length) return {error: 'Au moins un créneau est requis.'};
    const byId = new Map(existing.map(s => [s.id, s]));
    const create: SlotEdit[] = [];
    const update: (SlotEdit & {id: string})[] = [];
    const kept = new Set<string>();
    for (const slot of wanted) {
        if (!slot.id) {
            create.push(slot);
            continue;
        }
        const current = byId.get(slot.id);
        if (!current) return {error: "Un créneau modifié n'appartient pas à cette permanence."};
        if (kept.has(slot.id)) return {error: 'Un créneau apparaît deux fois.'};
        kept.add(slot.id);
        const samePlace = current.role === slot.role && (current.part ?? null) === (slot.part ?? null);
        if (current.registrations > 0 && !samePlace) {
            return {error: `Le créneau « ${current.role} » a des inscrits : son rôle et sa partie ne peuvent plus changer.`};
        }
        update.push({...slot, id: slot.id});
    }
    return {create, update, remove: existing.filter(s => !kept.has(s.id)).map(s => s.id)};
}
