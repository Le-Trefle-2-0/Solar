import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isAllowedImage} from './imageValidation.js';

process.env.IMAGE_ALLOWED_HOSTS = 'cdn.example.org';
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]).toString('base64');

test('accepts real images and allowed https hosts', () => {
    assert.ok(isAllowedImage(`data:image/png;base64,${png}`));
    assert.ok(isAllowedImage('https://cdn.example.org/a.png'));
});

test('rejects scripts, SVG, disguised content and other hosts', () => {
    for (const value of [
        '<script>alert(1)</script>',
        'javascript:alert(1)',
        'data:text/html;base64,PHNjcmlwdD4=',
        'data:image/svg+xml;base64,PHN2Zz4=',
        'data:image/png;base64,PHNjcmlwdD4=',
        'http://cdn.example.org/a.png',
        'https://evil.example.com/a.png',
        'https://cdn.example.org.evil.com/a.png',
        'https://cdn.example.org/"onerror="alert(1)',
    ]) assert.ok(!isAllowedImage(value), value);
});
