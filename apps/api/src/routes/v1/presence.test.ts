import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerPresenceRoutes, type OpenTicket, type PresenceDeps} from './presence.js';
import {assignRefusal, pickCurrentPermanence} from '../../lib/presence.js';

const at = (h: number, m = 0) => new Date(Date.UTC(2026, 10, 27, h, m));
const evening = {id: 'ev1', title: 'Permanence du soir', start: at(20), end: at(23), channelID: 'perm1'};

test('current permanence: the running one, or the one starting within 30 minutes', () => {
    const late = {...evening, id: 'ev2', start: at(22), end: at(23, 30)};
    assert.equal(pickCurrentPermanence([evening], at(21))?.id, 'ev1');
    assert.equal(pickCurrentPermanence([evening, late], at(22, 15))?.id, 'ev2');
    assert.equal(pickCurrentPermanence([evening], at(19, 40))?.id, 'ev1');
    assert.equal(pickCurrentPermanence([evening], at(19, 20)), null);
    assert.equal(pickCurrentPermanence([evening], at(23)), null);
});

test('assignment: present in the permanence and free; outside permanences, free', () => {
    assert.equal(assignRefusal({permanenceOn: true, present: true, otherOpenTicket: false}), null);
    assert.equal(assignRefusal({permanenceOn: true, present: false, otherOpenTicket: false}), 'not_present');
    assert.equal(assignRefusal({permanenceOn: true, present: true, otherOpenTicket: true}), 'busy');
    assert.equal(assignRefusal({permanenceOn: false, present: false, otherOpenTicket: false}), null);
    assert.equal(assignRefusal({permanenceOn: false, present: false, otherOpenTicket: true}), 'busy');
});

const PERMS: Record<string, string[]> = {
    vol: ['tickets.send_message'],
    renfort: ['tickets.send_message'],
    ref: ['tickets.read_all', 'tickets.attribute', 'tickets.send_message_all'],
    redac: ['newsletters.manage'],
};

function build(opts: {as?: string; permanence?: typeof evening | null; tickets?: OpenTicket[]} = {}) {
    const present = new Map<string, Date>([['vol', at(19, 55)]]);
    const notified: string[] = [];
    const deps: PresenceDeps = {
        authenticate: async () => opts.as ?? 'vol',
        getPermissions: async (id) => PERMS[id] ?? [],
        currentPermanence: async () => (opts.permanence === undefined ? evening : opts.permanence),
        presences: async () => [...present].map(([userId, joinedAt]) => ({userId, joinedAt})),
        join: async (_e, userId) => void (present.has(userId) || present.set(userId, at(20, 30))),
        leave: async (_e, userId) => void present.delete(userId),
        registeredUserIds: async () => ['vol', 'absent'],
        users: async (ids) => ids.map(id => ({id, name: id.toUpperCase(), image: null})),
        openTicketsOf: async (ids) => (opts.tickets ?? []).filter(t => ids.includes(t.assignedUserId)),
        notify: async (event) => void notified.push(event),
    };
    const app = Fastify();
    registerPresenceRoutes(app, deps);
    return {app, present, notified};
}

test('join: registered or reinforcement, only volunteers who can take écoutes, only during a permanence', async () => {
    const reinforcement = build({as: 'renfort'});
    assert.equal((await reinforcement.app.inject({method: 'POST', url: '/v1/permanence/join'})).statusCode, 200);
    assert.ok(reinforcement.present.has('renfort'));
    assert.deepEqual(reinforcement.notified, ['presenceUpdate']);
    // Joining twice changes nothing
    await reinforcement.app.inject({method: 'POST', url: '/v1/permanence/join'});
    assert.equal(reinforcement.present.size, 2);

    assert.equal((await build({as: 'redac'}).app.inject({method: 'POST', url: '/v1/permanence/join'})).statusCode, 403);
    assert.equal((await build({permanence: null}).app.inject({method: 'POST', url: '/v1/permanence/join'})).statusCode, 409);
});

test('presence: volunteers see their own state, managers the whole team', async () => {
    const vol = (await build().app.inject('/v1/permanence/presence')).json();
    assert.deepEqual(vol.me, {present: true, canJoin: true, registered: true});
    assert.equal(vol.team, null);

    const tickets: OpenTicket[] = [
        {id: 42, channelId: 'chan42', assignedUserId: 'vol', statusName: 'started'},
        {id: 41, channelId: 'chan41', assignedUserId: 'vol', statusName: 'closed'},
    ];
    const manager = build({as: 'ref', tickets});
    await build({as: 'renfort'}).app.inject({method: 'POST', url: '/v1/permanence/join'});
    manager.present.set('renfort', at(20, 30));
    const {team} = (await manager.app.inject('/v1/permanence/presence')).json();
    assert.deepEqual(team.present.map((p: any) => [p.id, p.registered, p.status, p.ticket?.reference ?? null, p.transmissionsDue]), [
        ['vol', true, 'in_ticket', '00042', 1],
        ['renfort', false, 'available', null, 0],
    ]);
    assert.deepEqual(team.expected, [{id: 'absent', name: 'ABSENT'}]);
});

test('leave: oneself or, for managers, someone else; never in the middle of an écoute', async () => {
    const busy = build({tickets: [{id: 42, channelId: 'chan42', assignedUserId: 'vol', statusName: 'started'}]});
    const refused = await busy.app.inject({method: 'POST', url: '/v1/permanence/leave'});
    assert.equal(refused.statusCode, 409);
    assert.deepEqual(refused.json(), {error: 'in_ticket', reference: '00042'});

    const free = build();
    assert.equal((await free.app.inject({method: 'POST', url: '/v1/permanence/leave'})).statusCode, 200);
    assert.equal(free.present.has('vol'), false);

    const other = build({as: 'renfort'});
    assert.equal((await other.app.inject({method: 'POST', url: '/v1/permanence/leave', payload: {userId: 'vol'}})).statusCode, 403);
    const manager = build({as: 'ref'});
    assert.equal((await manager.app.inject({method: 'POST', url: '/v1/permanence/leave', payload: {userId: 'vol'}})).statusCode, 200);
    assert.equal(manager.present.has('vol'), false);
});
