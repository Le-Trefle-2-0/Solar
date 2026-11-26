import {prisma} from '../prisma.js';
import {DEFAULT_ROLES} from './defaultRoles.js';
import {DEFAULT_ROLE} from './permissionCatalogue.js';

/**
 * On a fresh install (no role at all), creates the default roles. Once roles exist they are
 * managed from the roles page, so a deleted or renamed default role is not brought back;
 * only the "none" default role is always ensured.
 */
export async function seedDefaultRoles() {
    try {
        const count = await prisma.role.count();
        const toCreate = count === 0 ? DEFAULT_ROLES : DEFAULT_ROLES.filter(r => r.name === DEFAULT_ROLE);
        for (const role of toCreate) {
            await prisma.role.upsert({
                where: {name: role.name},
                update: {},
                create: {name: role.name, weight: role.weight, icon: role.icon, permissions: JSON.stringify(role.permissions)},
            });
        }
        console.log(`[db] Default roles verified (${toCreate.map(r => r.name).join(', ')}).`);
    } catch (error) {
        console.error("[db] Error seeding default roles:", error);
    }
}
