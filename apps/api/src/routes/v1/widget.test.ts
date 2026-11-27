import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import {registerWidgetRoutes} from './widget.js';
import {registerWsRoutes} from './ws.js';
import {signWidgetSession, verifyWidgetSession} from '../../lib/widgetSession.js';

process.env.WS_GUEST_SECRET = 'test-secret';

const future = () => Date.now() + 60_000;

function cookies(channelId: string, exp = future(), sig?: string): Record<string, string> {
    return {
        widget_channel: channelId,
        widget_uid: 'guest_1',
        widget_exp: String(exp),
        widget_sig: sig ?? signWidgetSession(channelId, 'guest_1', exp),
    };
}

const invalid: [string, Record<string, string>][] = [
    ['no cookies', {}],
    ['no signature', {widget_channel: 'c', widget_uid: 'guest_1'}],
    ['forged signature', cookies('c', future(), 'a'.repeat(64))],
    ['signature of another channel', {...cookies('other'), widget_channel: 'c'}],
    ['expired session', cookies('c', Date.now() - 1)],
];

async function build(statusName = 'waiting') {
    const app = Fastify();
    await app.register(cookie);
    await registerWidgetRoutes(app, {widgetEnabled: async () => true});
    await registerWsRoutes(app, {findTicketByChannelId: async () => ({statusName})});
    return app;
}

test('a correctly signed session is accepted', () => {
    assert.equal(verifyWidgetSession(cookies('c'))?.channelId, 'c');
});

for (const [name, jar] of invalid) {
    test(`401 on every widget route: ${name}`, async () => {
        const app = await build();
        for (const [method, url] of [
            ['GET', '/v1/messages/widget/c'],
            ['POST', '/v1/messages/widget/c'],
            ['GET', '/v1/widget/status'],
            ['POST', '/v1/widget/close'],
            ['POST', '/v1/ws/guest'],
        ] as const) {
            const res = await app.inject({method, url, cookies: jar, payload: {channelId: 'c', content: 'x'}});
            assert.equal(res.statusCode, 401, `${method} ${url}`);
        }
    });
}

test('401 on messages of a channel other than the signed one', async () => {
    const res = await (await build()).inject({url: '/v1/messages/widget/victim', cookies: cookies('c')});
    assert.equal(res.statusCode, 401);
});

const guest = async (channelId: string, statusName?: string) => (await build(statusName)).inject({
    method: 'POST', url: '/v1/ws/guest', cookies: cookies('c'), payload: {channelId, uid: 'chosen-by-caller'},
});

test('ws/guest: 403 for a channel the caller does not own', async () => {
    assert.equal((await guest('victim')).statusCode, 403);
});

test('ws/guest: 403 once the ticket is closed', async () => {
    assert.equal((await guest('c', 'closed')).statusCode, 403);
});

test('ws/guest: credentials come from the session, not the body', async () => {
    const res = await guest('c');
    assert.equal(res.statusCode, 200);
    assert.equal(res.json().credentials.uid, 'guest_1');
});

test('widget switched off: every visitor route refuses, availability answers closed', async () => {
    const app = Fastify();
    await app.register(cookie);
    await registerWidgetRoutes(app, {widgetEnabled: async () => false});
    await registerWsRoutes(app, {findTicketByChannelId: async () => ({statusName: 'started'})});
    for (const [method, url] of [
        ['GET', '/v1/widget/challenge'],
        ['POST', '/v1/widget/session'],
        ['GET', '/v1/widget/status'],
        ['POST', '/v1/widget/close'],
        ['POST', '/v1/widget/voice'],
        ['GET', '/v1/messages/widget/c?limit=60'],
        ['POST', '/v1/messages/widget/c'],
        ['POST', '/v1/ws/guest'],
    ] as const) {
        // A valid session changes nothing: an écoute in progress cannot be continued either
        const res = await app.inject({method, url, cookies: cookies('c'), payload: {channelId: 'c', content: 'x'}});
        assert.equal(res.statusCode, 403, `${method} ${url}`);
        assert.equal(res.json().error, 'widget_disabled', `${method} ${url}`);
    }
    const availability = await app.inject({url: '/v1/widget/availability'});
    assert.equal(availability.statusCode, 200);
    assert.deepEqual(availability.json(), {open: false, nextOpening: null, disabled: true});
});

test('widget switched off: the rest of the API is untouched', async () => {
    const app = Fastify();
    await registerWidgetRoutes(app, {widgetEnabled: async () => false});
    app.get('/v1/tickets', async () => ({ok: true}));
    assert.equal((await app.inject({url: '/v1/tickets'})).statusCode, 200);
});
