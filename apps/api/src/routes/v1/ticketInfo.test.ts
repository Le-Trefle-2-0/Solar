import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerTicketInfoRoutes, type TicketInfoDeps} from './ticketInfo.js';
import {anonymityNumber, requesterHash} from '../../lib/requester.js';
import {pseudonymize} from '../../lib/pseudonym.js';

process.env.DISCORD_ID_HASH_SECRET ??= 'test-secret';

const DISCORD_USER = '123456789012345678';
const openTicket = {
    id: 42, channelId: 'chan42', source: 'discord', statusName: 'started', discordUserID: DISCORD_USER, assignedUserId: 'vol',
};

function build(opts: {as?: string; perms?: string[]; ticket?: typeof openTicket} = {}) {
    const notes: {content: string; userId: string}[] = [];
    const notified: {room: string; event: string; data: any}[] = [];
    const hashes: string[] = [];
    const deps: TicketInfoDeps = {
        authenticate: async () => opts.as ?? 'vol',
        getPermissions: async () => opts.perms ?? ['tickets.send_message'],
        findTicket: async (channelId) => (channelId === 'chan42' ? opts.ticket ?? openTicket : null),
        vigilancesOf: async (hash) => {
            hashes.push(hash);
            return [{id: 'v1', category: 'Propos agressifs', note: 'Insultes répétées', createdAt: new Date('2026-10-01T20:00:00Z')}];
        },
        findUsers: async () => [{id: 'vol2', name: 'Camille'}],
        findAssignments: async () => [{userId: 'vol2', at: new Date('2026-11-20T10:00:00Z')}],
        userName: async () => 'Dominique',
        saveInternalNote: async (_t, userId, content) => {
            notes.push({userId, content});
            return {id: 99, createdAt: new Date(5)};
        },
        notify: async (room, event, data) => void notified.push({room, event, data}),
    };
    const app = Fastify();
    registerTicketInfoRoutes(app, deps);
    return {app, notes, notified, hashes};
}

test('anonymity number: same for every écoute of a person, before and after closing', () => {
    const open = requesterHash(DISCORD_USER);
    assert.equal(requesterHash(pseudonymize(DISCORD_USER)), open);
    assert.match(anonymityNumber(open), /^[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    assert.notEqual(anonymityNumber(requesterHash('223456789012345678')), anonymityNumber(open));
});

test('info: vigilances of the person, anonymity number, no ineligible list without tickets.attribute', async () => {
    const {app, hashes} = build();
    const res = await app.inject('/v1/tickets/chan42/info');
    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.anonymityNumber, anonymityNumber(requesterHash(DISCORD_USER)));
    // Looked up by the hash, never by the Discord id
    assert.deepEqual(hashes, [requesterHash(DISCORD_USER)]);
    assert.deepEqual(body.vigilances, [{id: 'v1', category: 'Propos agressifs', note: 'Insultes répétées', createdAt: '2026-10-01T20:00:00.000Z'}]);
    assert.equal(body.ineligible, null);
    assert.deepEqual(body.reveal, {available: true, allowed: false});
    assert.ok(!JSON.stringify(body).includes(DISCORD_USER));
});

test('info: ineligible volunteers for those who assign écoutes; other écoutes refused', async () => {
    const supervisor = build({as: 'ref', perms: ['tickets.read_all', 'tickets.attribute']});
    const body = (await supervisor.app.inject('/v1/tickets/chan42/info')).json();
    assert.deepEqual(body.ineligible, [{id: 'vol2', name: 'Camille', until: '2026-12-20T10:00:00.000Z'}]);

    // Assigned to someone else, or unknown: same refusal
    assert.equal((await build({as: 'other'}).app.inject('/v1/tickets/chan42/info')).statusCode, 403);
    assert.equal((await build().app.inject('/v1/tickets/nope/info')).statusCode, 403);
});

test('reveal: managers only, with a reason written as a team note in the transcript', async () => {
    const reveal = (b: ReturnType<typeof build>, reason: unknown) =>
        b.app.inject({method: 'POST', url: '/v1/tickets/chan42/reveal', payload: {reason}});

    assert.equal((await reveal(build(), 'Mise en danger imminente')).statusCode, 403);

    const manager = build({as: 'resp', perms: ['tickets.read_all', 'tickets.reveal_identity']});
    assert.equal((await reveal(manager, 'urgent')).statusCode, 400);
    const res = await reveal(manager, 'Mise en danger imminente, appel du 15');
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().discordUserId, DISCORD_USER);
    assert.deepEqual(manager.notes, [{userId: 'resp', content: 'Identifiant Discord révélé par Dominique. Motif : Mise en danger imminente, appel du 15'}]);
    // The note does not carry the id itself, and goes to the team only
    assert.ok(!manager.notes[0].content.includes(DISCORD_USER));
    assert.equal(manager.notified[0].event, 'message');
    assert.equal(manager.notified[0].data.internal, true);
});

test('reveal: impossible once closed (the id is hashed) or for a website écoute', async () => {
    const perms = ['tickets.read_all', 'tickets.reveal_identity'];
    const closed = build({as: 'resp', perms, ticket: {...openTicket, statusName: 'closed', discordUserID: pseudonymize(DISCORD_USER)}});
    const web = build({as: 'resp', perms, ticket: {...openTicket, source: 'web', discordUserID: 'web:1b2c'}});
    for (const b of [closed, web]) {
        assert.deepEqual((await b.app.inject('/v1/tickets/chan42/info')).json().reveal, {available: false, allowed: true});
        const res = await b.app.inject({method: 'POST', url: '/v1/tickets/chan42/reveal', payload: {reason: 'Mise en danger imminente'}});
        assert.equal(res.statusCode, 409);
        assert.equal(b.notes.length, 0);
    }
});
