import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildApp, contentMatchesType, fileContentSecurityPolicy, type StoredFile} from './app.js';

const SECRET = 'storage-test-secret';

async function setup() {
    const files = new Map<string, StoredFile>();
    let n = 0;
    const app = await buildApp({
        secret: SECRET,
        create: async (data) => {
            const f = {...data, id: `f${++n}`, createdAt: new Date(0)};
            files.set(f.id, f);
            const {content, ...meta} = f;
            return meta;
        },
        findMeta: async (id) => {
            const f = files.get(id);
            if (!f) return null;
            const {content, ...meta} = f;
            return meta;
        },
        find: async (id) => files.get(id) ?? null,
        remove: async (id) => files.delete(id),
    });
    files.set('existing', {
        id: 'existing', filename: 'id.pdf', content: Buffer.from('%PDF'), mime: 'application/pdf',
        size: 4, createdAt: new Date(0), uploadedById: 'u1',
    });
    return {app, files};
}

function multipart(filename: string, type: string, body: string) {
    const boundary = '----solar';
    const payload = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n`
        + `Content-Type: ${type}\r\n\r\n${body}\r\n--${boundary}--\r\n`;
    return {payload, headers: {'content-type': `multipart/form-data; boundary=${boundary}`}};
}

const auth = {authorization: `Bearer ${SECRET}`};

test('storage: every route refuses a missing or wrong secret', async () => {
    const {app, files} = await setup();
    const routes = [
        {method: 'GET', url: '/v1/files/existing'},
        {method: 'GET', url: '/v1/files/existing/meta'},
        {method: 'DELETE', url: '/v1/files/existing'},
        {method: 'POST', url: '/v1/files', ...multipart('a.pdf', 'application/pdf', '%PDF')},
    ] as const;
    for (const headers of [{}, {authorization: 'Bearer wrong'}, {authorization: SECRET}]) {
        for (const r of routes) {
            const res = await app.inject({...r, headers: {...('headers' in r ? r.headers : {}), ...headers}} as any);
            assert.equal(res.statusCode, 401, `${r.method} ${r.url} with ${JSON.stringify(headers)}`);
        }
    }
    assert.ok(files.has('existing'), 'nothing was deleted');
    assert.equal(files.size, 1, 'nothing was uploaded');
});

test('storage: no CORS header is sent', async () => {
    const {app} = await setup();
    const res = await app.inject({method: 'GET', url: '/v1/files/existing', headers: {...auth, origin: 'https://evil.example'}});
    assert.equal(res.headers['access-control-allow-origin'], undefined);
    const pre = await app.inject({method: 'OPTIONS', url: '/v1/files', headers: {origin: 'https://evil.example', 'access-control-request-method': 'POST'}});
    assert.equal(pre.headers['access-control-allow-origin'], undefined);
});

test('storage: upload with the secret records the uploader', async () => {
    const {app, files} = await setup();
    const res = await app.inject({method: 'POST', url: '/v1/files', ...multipart('a.pdf', 'application/pdf', '%PDF-1.7 doc'),
        headers: {...multipart('a.pdf', 'application/pdf', '%PDF-1.7 doc').headers, ...auth, 'x-uploaded-by': 'u2'}});
    assert.equal(res.statusCode, 200);
    assert.equal(files.get(res.json().id)?.uploadedById, 'u2');
});

test('storage: upload without uploader or with a disallowed type is refused', async () => {
    const {app} = await setup();
    const html = multipart('x.html', 'text/html', '<script>alert(1)</script>');
    assert.equal((await app.inject({method: 'POST', url: '/v1/files', payload: html.payload,
        headers: {...html.headers, ...auth, 'x-uploaded-by': 'u2'}})).statusCode, 415);
    const pdf = multipart('a.pdf', 'application/pdf', '%PDF');
    assert.equal((await app.inject({method: 'POST', url: '/v1/files', payload: pdf.payload,
        headers: {...pdf.headers, ...auth}})).statusCode, 400);
});

test('storage: served files carry nosniff and a policy that runs nothing', async () => {
    const {app} = await setup();
    const res = await app.inject({method: 'GET', url: '/v1/files/existing', headers: auth});
    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.match(String(res.headers['content-security-policy']), /default-src 'none'/);
    assert.match(fileContentSecurityPolicy('image/png'), /sandbox/);
});

test('storage: a file whose content is not of its declared type is refused (#253)', async () => {
    const {app} = await setup();
    const disguised = multipart('photo.png', 'image/png', '<html><script>alert(1)</script></html>');
    const res = await app.inject({method: 'POST', url: '/v1/files', payload: disguised.payload,
        headers: {...disguised.headers, ...auth, 'x-uploaded-by': 'u2'}});
    assert.equal(res.statusCode, 415);
    assert.equal(contentMatchesType('image/png', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])), true);
    assert.equal(contentMatchesType('image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xe0])), true);
    assert.equal(contentMatchesType('application/pdf', Buffer.from('<html>')), false);
});

test('storage: delete with the secret works, unknown id is 404', async () => {
    const {app, files} = await setup();
    assert.equal((await app.inject({method: 'DELETE', url: '/v1/files/existing', headers: auth})).statusCode, 200);
    assert.equal(files.has('existing'), false);
    assert.equal((await app.inject({method: 'DELETE', url: '/v1/files/existing', headers: auth})).statusCode, 404);
});

test('storage: buildApp refuses an empty secret', async () => {
    await assert.rejects(() => buildApp({secret: ''} as any));
});
