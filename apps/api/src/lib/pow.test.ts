import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'crypto';
import Fastify from 'fastify';
import {createChallenge, hasLeadingZeroBits, verifyPow} from './pow.js';
import {registerTicketsRoutes} from '../routes/v1/tickets.js';

process.env.WS_GUEST_SECRET = 'test-secret';

function solve(challenge = createChallenge()) {
    for (let nonce = 0; ; nonce++) {
        const hash = createHash('sha256').update(`${challenge.salt}.${nonce}`).digest();
        if (hasLeadingZeroBits(hash, challenge.difficulty)) return {...challenge, nonce};
    }
}

test('a solved challenge is accepted once', () => {
    const solution = solve();
    assert.ok(verifyPow(solution));
    assert.ok(!verifyPow(solution));
});

test('missing, unsolved, forged and expired solutions are rejected', () => {
    assert.ok(!verifyPow(undefined));
    assert.ok(!verifyPow({...createChallenge(), nonce: -1}));
    assert.ok(!verifyPow({...solve(), sig: 'a'.repeat(64)}));
    assert.ok(!verifyPow(solve(createChallenge(Date.now() - 3_600_000))));
});

test('public ticket creation requires a proof of work', async () => {
    const app = Fastify();
    await registerTicketsRoutes(app);
    const res = await app.inject({method: 'POST', url: '/v1/tickets/web-create', payload: {}});
    assert.equal(res.statusCode, 403);
});
