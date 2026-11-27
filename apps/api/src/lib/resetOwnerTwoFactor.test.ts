import {test} from 'node:test';
import assert from 'node:assert/strict';
import {findOwner, resetTwoFactor} from './resetOwnerTwoFactor.js';

function fakeDb(ownerId: string | null) {
    const calls: [string, unknown][] = [];
    const record = (name: string) => (args: unknown) => {
        calls.push([name, args]);
        return name;
    };
    const transactions: unknown[][] = [];
    const db = {
        settings: {findUnique: async () => ownerId ? {value: ownerId} : null},
        user: {
            findUnique: async ({where}: any) => ({id: where.id, email: 'owner@x.fr', twoFactorEnabled: true}),
            update: record('user.update'),
        },
        twoFactor: {deleteMany: record('twoFactor.deleteMany')},
        session: {deleteMany: record('session.deleteMany')},
        $transaction: async (operations: unknown[]) => void transactions.push(operations),
    };
    return {db, calls, transactions};
}

test('the owner is the account named in the settings, none without it', async () => {
    assert.equal((await findOwner(fakeDb('boss').db))?.id, 'boss');
    assert.equal(await findOwner(fakeDb(null).db), null);
});

test('reset removes the second factor and the sessions of that account only, in one transaction', async () => {
    const {db, calls, transactions} = fakeDb('boss');
    await resetTwoFactor(db, 'boss');
    assert.deepEqual(calls, [
        ['twoFactor.deleteMany', {where: {userId: 'boss'}}],
        ['user.update', {where: {id: 'boss'}, data: {twoFactorEnabled: false}}],
        ['session.deleteMany', {where: {userId: 'boss'}}],
    ]);
    assert.deepEqual(transactions, [['twoFactor.deleteMany', 'user.update', 'session.deleteMany']]);
});
