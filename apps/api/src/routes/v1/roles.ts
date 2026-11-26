import type {FastifyInstance} from 'fastify';
import {prisma} from '../../prisma.js';
import {authenticate} from '../../auth.js';
import {broadcast} from '../../lib/broadcast.js';
import {DEFAULT_ROLE} from '../../lib/permissionCatalogue.js';
import {getActor, getKnownRoles, getOwnerId} from '../../lib/permissions.js';
import {
    type Actor,
    checkRoleAssignment,
    checkRoleDelete,
    checkRoleEdit,
    type KnownRole,
    withDefaultRole,
    planReorder,
    rankOf,
    renameInRoleString,
    splitRoles,
} from '../../lib/roleAssignment.js';

type StoredRole = Required<Pick<KnownRole, 'id' | 'name' | 'weight'>> & {permissions: string[]; icon: string | null};

export interface RolesRouteDeps {
    authenticate: (req: any) => Promise<string | null | undefined>;
    getActor: (userId: string) => Promise<Actor | null>;
    listRoles: () => Promise<StoredRole[]>;
    findUser: (id: string) => Promise<{id: string; role: string | null; isOwner: boolean} | null>;
    /** Creates or updates the role; on rename, every user holding the old name gets the new one. */
    saveRole: (existing: StoredRole | null, data: {name: string; weight: number; permissions: string[]; icon: string | null}) => Promise<StoredRole>;
    /** Deletes the role and removes it from every user (who falls back to the default role if none is left). */
    deleteRole: (role: StoredRole) => Promise<void>;
    setWeights: (updates: {id: string; weight: number}[]) => Promise<void>;
    setUserRoles: (userId: string, roles: string[]) => Promise<{id: string; role: string | null}>;
    notify: (role: {id: string; name: string; permissions: string[]} | null) => Promise<void>;
}

const serialize = (r: StoredRole) => ({...r, permissions: JSON.stringify(r.permissions)});

const defaultDeps: RolesRouteDeps = {
    authenticate,
    getActor,
    listRoles: async () => {
        const rows = await prisma.role.findMany({orderBy: {weight: 'desc'}});
        const known = await getKnownRoles();
        const perms = new Map(known.map(k => [k.id, k.permissions ?? []]));
        return rows.map(r => ({id: r.id, name: r.name, weight: r.weight, icon: r.icon, permissions: perms.get(r.id) ?? []}));
    },
    findUser: async (id) => {
        const [user, ownerId] = await Promise.all([
            prisma.user.findUnique({where: {id}, select: {id: true, role: true}}),
            getOwnerId(),
        ]);
        return user ? {...user, isOwner: user.id === ownerId} : null;
    },
    saveRole: async (existing, data) => {
        const row = await prisma.$transaction(async (tx) => {
            const fields = {name: data.name, weight: data.weight, icon: data.icon, permissions: JSON.stringify(data.permissions)};
            const saved = existing
                ? await tx.role.update({where: {id: existing.id}, data: fields})
                : await tx.role.create({data: fields});
            if (existing && existing.name !== data.name) {
                const holders = await tx.user.findMany({where: {role: {contains: existing.name}}, select: {id: true, role: true}});
                for (const u of holders) {
                    if (!splitRoles(u.role).includes(existing.name)) continue;
                    await tx.user.update({where: {id: u.id}, data: {role: renameInRoleString(u.role, existing.name, data.name)}});
                }
            }
            return saved;
        });
        return {id: row.id, name: row.name, weight: row.weight, icon: row.icon, permissions: data.permissions};
    },
    deleteRole: async (role) => {
        await prisma.$transaction(async (tx) => {
            const holders = await tx.user.findMany({where: {role: {contains: role.name}}, select: {id: true, role: true}});
            for (const u of holders) {
                if (!splitRoles(u.role).includes(role.name)) continue;
                await tx.user.update({where: {id: u.id}, data: {role: renameInRoleString(u.role, role.name, null)}});
            }
            await tx.role.delete({where: {id: role.id}});
        });
    },
    setWeights: async (updates) => {
        await prisma.$transaction(updates.map(u => prisma.role.update({where: {id: u.id}, data: {weight: u.weight}})));
    },
    setUserRoles: (userId, roles) => prisma.user.update({where: {id: userId}, data: {role: roles.join(',')}, select: {id: true, role: true}}),
    notify: async (role) => {
        await broadcast(null, 'permissionsUpdate', role
            ? {roleId: role.id, roleName: role.name, permissions: role.permissions}
            : {roleId: null, roleName: null, permissions: []});
    },
};

/** The UI used to send permissions as a JSON string; accept both. */
function readPermissions(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

export async function registerRolesRoutes(app: FastifyInstance, deps: RolesRouteDeps = defaultDeps) {
    async function requireActor(req: any, reply: any): Promise<Actor | null> {
        const userId = await deps.authenticate(req);
        const actor = userId ? await deps.getActor(userId) : null;
        if (!actor) {
            reply.status(401).send('unauthorized');
            return null;
        }
        return actor;
    }

    // Role names, icons and order are visible to every member (the planning uses them).
    // `me` tells the UI what the caller may change.
    app.get('/v1/admin/roles', async (req, reply) => {
        const actor = await requireActor(req, reply);
        if (!actor) return;
        const roles = await deps.listRoles();
        const rank = rankOf(actor.isOwner, actor.roles, roles);
        return reply.send({
            // The default role ("none") is an implementation detail: never listed, edited or assigned by hand
            roles: roles.filter(r => r.name !== DEFAULT_ROLE).map(serialize),
            me: {
                isOwner: actor.isOwner,
                // Weight of the caller's highest role; null for the owner (above all) or without any role.
                // The caller can manage roles strictly below it (any role when isOwner).
                rank: Number.isFinite(rank) ? rank : null,
                permissions: actor.permissions,
            },
        });
    });

    app.post('/v1/admin/roles', async (req, reply) => {
        const actor = await requireActor(req, reply);
        if (!actor) return;

        const body = (req.body ?? {}) as {id?: unknown; name?: unknown; weight?: unknown; permissions?: unknown; icon?: unknown};
        const roles = await deps.listRoles();
        const existing = typeof body.id === 'string' ? roles.find(r => r.id === body.id) ?? null : null;
        if (typeof body.id === 'string' && !existing) return reply.status(404).send('role not found');

        const permissions = readPermissions(body.permissions);
        const refusal = checkRoleEdit({
            actor,
            knownRoles: roles,
            existing,
            requested: {name: body.name, weight: body.weight, permissions},
            nameTaken: roles.some(r => r.name === body.name && r.id !== existing?.id),
        });
        if (refusal) return reply.status(refusal.status).send(refusal.message);

        const icon = typeof body.icon === 'string' && body.icon.length <= 64 ? body.icon : existing?.icon ?? null;
        const role = await deps.saveRole(existing, {
            name: body.name as string,
            weight: body.weight as number,
            permissions: permissions as string[],
            icon,
        });
        await deps.notify(role);
        return reply.send({role: serialize(role)});
    });

    // Body: {ids: string[]}, every role below the caller's rank, highest first.
    app.post('/v1/admin/roles/reorder', async (req, reply) => {
        const actor = await requireActor(req, reply);
        if (!actor) return;
        const roles = await deps.listRoles();
        const plan = planReorder(actor, roles, (req.body as {ids?: unknown} | undefined)?.ids);
        if ('refusal' in plan) return reply.status(plan.refusal.status).send(plan.refusal.message);
        await deps.setWeights(plan.updates);
        await deps.notify(null);
        return reply.send({success: true, updates: plan.updates});
    });

    app.delete('/v1/admin/roles/:id', async (req, reply) => {
        const actor = await requireActor(req, reply);
        if (!actor) return;
        const {id} = req.params as {id: string};
        const roles = await deps.listRoles();
        const role = roles.find(r => r.id === id);
        if (!role) return reply.status(404).send('role not found');

        const refusal = checkRoleDelete(actor, role, roles);
        if (refusal) return reply.status(refusal.status).send(refusal.message);

        await deps.deleteRole(role);
        await deps.notify(null);
        return reply.send({success: true});
    });

    app.post('/v1/admin/users/:id/role', async (req, reply) => {
        const actor = await requireActor(req, reply);
        if (!actor) return;
        if (!actor.permissions.includes('admin.sudo') && !actor.permissions.includes('roles.manage')) {
            return reply.status(403).send('forbidden: roles.manage required');
        }

        const {id} = req.params as {id: string};
        const target = await deps.findUser(id);
        if (!target) return reply.status(404).send('user not found');

        // An empty selection removes every role (stored as the default role)
        const requested = withDefaultRole((req.body as {roles?: unknown} | undefined)?.roles);
        const refusal = checkRoleAssignment({
            actor,
            target: {id: target.id, isOwner: target.isOwner, roles: splitRoles(target.role)},
            requested,
            knownRoles: await deps.listRoles(),
        });
        if (refusal) return reply.status(refusal.status).send(refusal.message);

        const user = await deps.setUserRoles(id, requested as string[]);
        await deps.notify(null);
        return reply.send({user});
    });
}
