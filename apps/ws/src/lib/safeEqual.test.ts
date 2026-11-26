import test from 'node:test';
import assert from 'node:assert/strict';
import {safeEqual} from './safeEqual.js';

test('safeEqual: equal strings match', () => {
    assert.equal(safeEqual('s3cret-value', 's3cret-value'), true);
});

test('safeEqual: different strings of the same length do not match', () => {
    assert.equal(safeEqual('s3cret-valuX', 's3cret-value'), false);
});

test('safeEqual: different lengths do not match and do not throw', () => {
    assert.equal(safeEqual('short', 's3cret-value'), false);
    assert.equal(safeEqual('s3cret-value-longer', 's3cret-value'), false);
});

test('safeEqual: an empty expected secret never matches', () => {
    assert.equal(safeEqual('', ''), false);
    assert.equal(safeEqual('anything', ''), false);
});
