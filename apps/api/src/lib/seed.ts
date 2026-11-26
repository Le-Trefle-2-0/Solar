import {prisma} from '../prisma.js';
import {DEFAULT_ROLES} from './defaultRoles.js';
import {DEFAULT_ROLE} from './permissionCatalogue.js';
import {renameInRoleString, splitRoles} from './roleAssignment.js';

const OWNER_SETTING_KEY = 'owner_user_id';

/**
 * A fresh install has no role besides the hidden default one (a migration creates "none",
 * so "the table is empty" is not the right test).
 */
export function needsDefaultRoles(existingNames: string[]): boolean {
    return existingNames.every(name => name === DEFAULT_ROLE);
}

const toRow = (r: typeof DEFAULT_ROLES[number]) =>
    ({name: r.name, weight: r.weight, icon: r.icon, permissions: JSON.stringify(r.permissions)});

/** Gives the owner the top role when they have none yet (cosmetic: the owner holds every permission). */
async function giveOwnerTopRole() {
    const owner = await prisma.settings.findUnique({where: {key: OWNER_SETTING_KEY}});
    if (!owner?.value) return;
    const user = await prisma.user.findUnique({where: {id: owner.value}, select: {role: true}});
    if (!user || splitRoles(user.role).some(r => r !== DEFAULT_ROLE)) return;
    await prisma.user.update({where: {id: owner.value}, data: {role: DEFAULT_ROLES[0].name}});
}

/**
 * On a fresh install, creates the default roles. Once roles exist they are managed from the
 * roles page, so a deleted or renamed default role is not brought back; only the hidden
 * default role is always ensured.
 */
export async function seedDefaultRoles() {
    try {
        const existing = (await prisma.role.findMany({select: {name: true}})).map(r => r.name);
        const fresh = needsDefaultRoles(existing);
        const toCreate = fresh ? DEFAULT_ROLES : DEFAULT_ROLES.filter(r => r.name === DEFAULT_ROLE);
        for (const role of toCreate) {
            await prisma.role.upsert({where: {name: role.name}, update: {}, create: toRow(role)});
        }
        if (fresh) await giveOwnerTopRole();
        console.log(`[db] Default roles verified (${toCreate.map(r => r.name).join(', ')}).`);
    } catch (error) {
        console.error("[db] Error seeding default roles:", error);
    }
}

/**
 * Restores the default configuration: default roles get back their name, order, icon and
 * permissions; every other role is deleted and removed from its members (who fall back to
 * the hidden default role when nothing is left). Members keep the default roles they hold.
 */
export async function resetRolesToDefaults() {
    const defaultNames = new Set(DEFAULT_ROLES.map(r => r.name));
    await prisma.$transaction(async (tx) => {
        const extra = (await tx.role.findMany({select: {id: true, name: true}})).filter(r => !defaultNames.has(r.name));
        if (extra.length) {
            const extraNames = extra.map(r => r.name);
            const users = await tx.user.findMany({select: {id: true, role: true}});
            for (const u of users) {
                const held = splitRoles(u.role);
                if (!held.some(r => extraNames.includes(r))) continue;
                const next = extraNames.reduce<string | null>((acc, name) => renameInRoleString(acc, name, null), u.role);
                await tx.user.update({where: {id: u.id}, data: {role: next}});
            }
            await tx.role.deleteMany({where: {id: {in: extra.map(r => r.id)}}});
        }
        for (const role of DEFAULT_ROLES) {
            await tx.role.upsert({where: {name: role.name}, update: toRow(role), create: toRow(role)});
        }
    });
    await giveOwnerTopRole();
}
