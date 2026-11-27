import {prisma} from '../prisma.js';
import {
    defaultDiscordDeps,
    DiscordProfileError,
    downloadAvatar,
    fetchDiscordProfile,
    planPersonSync,
    type PersonUpdate,
} from './discordProfiles.js';

/**
 * Keeps the team showcase's people linked to Discord up to date: on demand (import, "Resynchroniser")
 * and regularly (every DISCORD_SYNC_INTERVAL_HOURS hours, 6 by default).
 */

const errorText = (e: unknown) => e instanceof DiscordProfileError ? e.message : 'Synchronisation impossible';

/** Resyncs one person. A failure keeps the current name and photo and records why. */
export async function syncTeamPerson(personId: string, {forceImage = false} = {}) {
    const person = await prisma.teamPerson.findUnique({where: {id: personId}});
    if (!person?.discordId) throw new DiscordProfileError('not_found', 'Cette personne n\'est pas liée à Discord');

    let update: PersonUpdate;
    try {
        const profile = await fetchDiscordProfile(person.discordId);
        update = await planPersonSync(
            person,
            profile,
            async (name) => (await prisma.teamPerson.count({where: {name, id: {not: person.id}}})) > 0,
            (url) => downloadAvatar(url),
            {forceImage},
        );
    } catch (e) {
        if (!(e instanceof DiscordProfileError)) console.error('[team] Discord sync failed:', (e as Error).message);
        update = {discordSyncedAt: new Date(), discordSyncError: errorText(e)};
    }
    return prisma.teamPerson.update({where: {id: person.id}, data: update});
}

/** Every linked person, one after the other (Discord rate limits). */
export async function syncAllTeamPeople() {
    const people = await prisma.teamPerson.findMany({
        where: {discordId: {not: null}, OR: [{syncName: true}, {syncImage: true}]},
        select: {id: true},
    });
    let failed = 0;
    for (const {id} of people) {
        const updated = await syncTeamPerson(id).catch(() => null);
        if (!updated || updated.discordSyncError) failed++;
        await new Promise(r => setTimeout(r, 300));
    }
    return {total: people.length, failed};
}

let timer: NodeJS.Timeout | null = null;

export function startTeamDiscordSync() {
    if (timer) return;
    if (!defaultDiscordDeps().token) {
        console.log('[team] DISCORD_TOKEN is not set: team photos are not synced with Discord');
        return;
    }
    const hours = Math.max(1, Number(process.env.DISCORD_SYNC_INTERVAL_HOURS) || 6);
    const run = async () => {
        try {
            const {total, failed} = await syncAllTeamPeople();
            if (total) console.log(`[team] Discord sync: ${total - failed}/${total} people up to date`);
        } catch (e) {
            console.error('[team] Discord sync failed:', (e as Error).message);
        }
    };
    // First run shortly after start-up, then regularly
    setTimeout(run, 60_000).unref();
    timer = setInterval(run, hours * 3600_000);
    timer.unref();
}
