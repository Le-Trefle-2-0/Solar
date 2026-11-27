import {test} from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import {errorHandler, publicMessage} from './errors.js';

test('uncaught errors do not reach the client', async () => {
    const app = Fastify();
    app.setErrorHandler(errorHandler);
    app.get('/boom', async () => {
        throw new TypeError('secret /srv/path SELECT * FROM user');
    });
    const res = await app.inject('/boom');
    assert.equal(res.statusCode, 500);
    assert.doesNotMatch(res.body, /secret|SELECT/);
});

test('only plain errors keep their message', () => {
    class PrismaLikeError extends Error {}
    assert.equal(publicMessage(new Error('Ce créneau est complet.')), 'Ce créneau est complet.');
    assert.equal(publicMessage(new PrismaLikeError('table dump')), 'internal_error');
});
