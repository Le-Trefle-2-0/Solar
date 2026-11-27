import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {registerSpectateRoutes, type OngoingTicket, type SpectateDeps, type SpectateRequestRow} from './spectate.js';
import {isOpenRequest, requestRefusal} from '../../lib/spectate.js';
import {canReadChannel, canWriteChannel} from '../../lib/channelAccess.js';

const PERMS: Record<string, string[]> = {
    trainee: ['tickets.spectate', 'permanence.register'],
    trainee2: ['tickets.spectate'],
    vol: ['tickets.send_message'],
    ref: ['tickets.read_all', 'tickets.attribute', 'tickets.send_message_all'],
};
const permanence = {id: 'ev1', title: 'Permanence', start: new Date(0), end: new Date(8.64e15), channelID: 'perm1'};

test('asking: trainees only, from the channel of the permanence on now, one request at a time', () => {
    const base = {permissions: PERMS.trainee, permanenceChannelId: 'perm1', channelId: 'perm1', hasOpenRequest: false};
    assert.equal(requestRefusal(base), null);
    assert.equal(requestRefusal({...base, permissions: PERMS.vol}), 'forbidden');
    assert.equal(requestRefusal({...base, permanenceChannelId: null}), 'no_permanence');
    assert.equal(requestRefusal({...base, channelId: '1'}), 'wrong_channel');
    assert.equal(requestRefusal({...base, channelId: 'chan42'}), 'wrong_channel');
    assert.equal(requestRefusal({...base, hasOpenRequest: true}), 'already_requested');
});

test('a request is open while pending, or approved on an écoute still in progress', () => {
    const ticket = (statusName: string) => ({id: 1, channelId: 'c', statusName});
    assert.equal(isOpenRequest({status: 'pending', ticket: null}), true);
    assert.equal(isOpenRequest({status: 'approved', ticket: ticket('started')}), true);
    assert.equal(isOpenRequest({status: 'approved', ticket: ticket('closed')}), false);
    assert.equal(isOpenRequest({status: 'refused', ticket: null}), false);
    assert.equal(isOpenRequest({status: 'ended', ticket: ticket('started')}), false);
});

test('observers read the écoute, never write in it, and only while their role allows it', () => {
    const channel = {channelId: 'chan42', assignedUserId: 'vol', isPermanence: false, spectatorIds: ['trainee']};
    assert.equal(canReadChannel({...channel, userId: 'trainee', permissions: PERMS.trainee}), true);
    assert.equal(canWriteChannel({...channel, userId: 'trainee', permissions: PERMS.trainee}), false);
    // Approved, but the role lost the permission since
    assert.equal(canReadChannel({...channel, userId: 'trainee', permissions: []}), false);
    // Another trainee, not approved on this écoute
    assert.equal(canReadChannel({...channel, userId: 'trainee2', permissions: PERMS.trainee2}), false);
});

function build(as: string, opts: {permanence?: typeof permanence | null; requests?: SpectateRequestRow[]; tickets?: OngoingTicket[]} = {}) {
    const requests: SpectateRequestRow[] = opts.requests ?? [];
    const tickets: OngoingTicket[] = opts.tickets ?? [
        {id: 42, channelId: 'chan42', statusName: 'started', assignedUserId: 'vol', volunteerName: 'VOL'},
        {id: 43, channelId: 'chan43', statusName: 'closed', assignedUserId: 'vol', volunteerName: 'VOL'},
    ];
    const notes: {channelId: string; content: string}[] = [];
    const notified: string[] = [];
    const live = () => requests.filter(r => r.status === 'pending' || r.status === 'approved');
    const deps: SpectateDeps = {
        authenticate: async () => as,
        getPermissions: async (id) => PERMS[id] ?? [],
        currentPermanence: async () => (opts.permanence === undefined ? permanence : opts.permanence),
        requestsOfUser: async (userId) => live().filter(r => r.userId === userId),
        liveRequests: async () => live(),
        findRequest: async (id) => requests.find(r => r.id === id) ?? null,
        create: async (eventId, userId) => void requests.push({
            id: `r${requests.length + 1}`, eventId, userId, status: 'pending', ticket: null, userName: userId.toUpperCase(), createdAt: new Date(),
        }),
        update: async (id, data) => {
            const r = requests.find(x => x.id === id)!;
            r.status = data.status;
            if (data.ticketId) {
                const t = tickets.find(x => x.id === data.ticketId)!;
                r.ticket = {id: t.id, channelId: t.channelId, statusName: t.statusName};
            }
        },
        ongoingTickets: async () => tickets.filter(t => t.statusName === 'started'),
        findTicket: async (id) => tickets.find(t => t.id === id) ?? null,
        userName: async (id) => id.toUpperCase(),
        saveInternalNote: async (ticket, _u, content) => {
            notes.push({channelId: ticket.channelId, content});
            return {id: notes.length, createdAt: new Date()};
        },
        notify: async (_room, event) => void notified.push(event),
    };
    const app = Fastify();
    registerSpectateRoutes(app, deps);
    return {app, requests, notes, notified};
}

const post = (app: ReturnType<typeof Fastify>, url: string, payload: unknown = {}) => app.inject({method: 'POST', url, payload: payload as any});

test('a trainee asks from the permanence channel; a second request waits for the first', async () => {
    const {app, requests, notified} = build('trainee');
    assert.equal((await post(app, '/v1/permanence/spectate', {channelId: 'perm1'})).statusCode, 200);
    assert.equal(requests[0].status, 'pending');
    assert.ok(notified.includes('spectateUpdate'));
    assert.equal((await post(app, '/v1/permanence/spectate', {channelId: 'perm1'})).json().error, 'already_requested');
    assert.equal((await post(app, '/v1/permanence/spectate', {channelId: '1'})).statusCode, 409);

    const me = (await app.inject({method: 'GET', url: '/v1/permanence/spectate'})).json();
    assert.equal(me.me.request.status, 'pending');
    assert.equal(me.manage, null, 'trainees never see the other requests');
});

test('only trainees may ask, and only during a permanence', async () => {
    assert.equal((await post(build('vol').app, '/v1/permanence/spectate', {channelId: 'perm1'})).statusCode, 403);
    const none = await post(build('trainee', {permanence: null}).app, '/v1/permanence/spectate', {channelId: 'perm1'});
    assert.equal(none.json().error, 'no_permanence');
});

const pending = (): SpectateRequestRow => ({id: 'r1', eventId: 'ev1', userId: 'trainee', status: 'pending', ticket: null, userName: 'TRAINEE', createdAt: new Date()});

test('a manager approves on an écoute in progress; it is written in the transcript', async () => {
    const {app, requests, notes, notified} = build('ref', {requests: [pending()]});
    const view = (await app.inject({method: 'GET', url: '/v1/permanence/spectate'})).json();
    assert.deepEqual(view.manage.tickets.map((t: any) => t.reference), ['00042']);
    assert.equal(view.manage.requests[0].user.name, 'TRAINEE');

    assert.equal((await post(app, '/v1/permanence/spectate/r1/approve', {ticketId: 43})).json().error, 'ticket_not_ongoing');
    assert.equal((await post(app, '/v1/permanence/spectate/r1/approve', {})).statusCode, 400);
    assert.equal((await post(app, '/v1/permanence/spectate/r1/approve', {ticketId: 42})).statusCode, 200);
    assert.equal(requests[0].status, 'approved');
    assert.equal(requests[0].ticket?.channelId, 'chan42');
    assert.equal(notes[0].channelId, 'chan42');
    assert.match(notes[0].content, /TRAINEE .* observe cette écoute en lecture seule, avec l'accord de REF/);
    assert.ok(notified.includes('updateRequest'), 'the trainee\'s sockets and sidebar follow the écoute');
    // Already decided
    assert.equal((await post(app, '/v1/permanence/spectate/r1/refuse')).json().error, 'not_pending');
});

test('only managers decide', async () => {
    for (const who of ['trainee', 'vol']) {
        const {app, requests} = build(who, {requests: [pending()]});
        assert.equal((await post(app, '/v1/permanence/spectate/r1/approve', {ticketId: 42})).statusCode, 403);
        assert.equal((await post(app, '/v1/permanence/spectate/r1/refuse')).statusCode, 403);
        assert.equal(requests[0].status, 'pending');
    }
    const {app, requests} = build('ref', {requests: [pending()]});
    assert.equal((await post(app, '/v1/permanence/spectate/r1/refuse')).statusCode, 200);
    assert.equal(requests[0].status, 'refused');
});

test('the trainee or a manager stops an observation; others cannot; it ends with the écoute', async () => {
    const approved = (): SpectateRequestRow => ({...pending(), status: 'approved', ticket: {id: 42, channelId: 'chan42', statusName: 'started'}});

    const other = build('trainee2', {requests: [approved()]});
    assert.equal((await post(other.app, '/v1/permanence/spectate/r1/end')).statusCode, 404);

    const self = build('trainee', {requests: [approved()]});
    assert.equal((await post(self.app, '/v1/permanence/spectate/r1/end')).statusCode, 200);
    assert.equal(self.requests[0].status, 'ended');
    assert.match(self.notes[0].content, /^TRAINEE n'observe plus cette écoute\.$/);

    const byManager = build('ref', {requests: [approved()]});
    assert.equal((await post(byManager.app, '/v1/permanence/spectate/r1/end')).statusCode, 200);
    assert.match(byManager.notes[0].content, /arrêtée par REF/);

    // The écoute closed: the observation is over, and a new request can be made
    const finished = build('trainee', {requests: [{...approved(), ticket: {id: 42, channelId: 'chan42', statusName: 'closed'}}]});
    assert.equal((await finished.app.inject({method: 'GET', url: '/v1/permanence/spectate'})).json().me.request, null);
    assert.equal(finished.requests[0].status, 'ended');
    assert.equal((await post(finished.app, '/v1/permanence/spectate', {channelId: 'perm1'})).statusCode, 200);
});
