import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerUsersRoutes, PUBLIC_USER_SELECT} from './users.js';

const FULL_USER = {
    id: 'victim', name: 'Victim', image: null, role: 'admin', displayUsername: 'v',
    email: 'v@example.com', password: 'hash', twoFactorSecret: 'secret', twoFactorEnabled: true,
};

async function build(perms: string[], authedAs: string | null) {
    const app = Fastify();
    await registerUsersRoutes(app, {
        authenticate: async () => authedAs,
        getPermissions: async () => perms,
        // Emulates Prisma `select`: only returns whitelisted fields.
        findUser: async (id) => id === 'victim'
            ? Object.fromEntries(Object.keys(PUBLIC_USER_SELECT).map(k => [k, (FULL_USER as any)[k]]))
            : null,
    });
    return app;
}

test('401 when unauthenticated', async () => {
    const app = await build([], null);
    assert.equal((await app.inject('/v1/users/victim')).statusCode, 401);
});

test('403 for third-party profile without users.read_all', async () => {
    const app = await build(['tickets.close'], 'attacker');
    assert.equal((await app.inject('/v1/users/victim')).statusCode, 403);
});

test('own profile allowed without users.read_all', async () => {
    const app = await build([], 'victim');
    assert.equal((await app.inject('/v1/users/victim')).statusCode, 200);
});

test('200 with users.read_all and no sensitive fields leaked', async () => {
    const app = await build(['users.read_all'], 'attacker');
    const res = await app.inject('/v1/users/victim');
    assert.equal(res.statusCode, 200);
    const body = res.json();
    for (const k of ['password', 'twoFactorSecret', 'twoFactorEnabled', 'email']) {
        assert.equal(k in body, false, `${k} must not be exposed`);
    }
    assert.deepEqual(Object.keys(body).sort(), Object.keys(PUBLIC_USER_SELECT).sort());
});

test('admin.sudo can read any profile', async () => {
    const app = await build(['admin.sudo'], 'attacker');
    assert.equal((await app.inject('/v1/users/victim')).statusCode, 200);
});

test('404 for unknown user when permitted', async () => {
    const app = await build(['users.read_all'], 'attacker');
    assert.equal((await app.inject('/v1/users/nope')).statusCode, 404);
});
