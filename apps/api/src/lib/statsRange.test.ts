import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseStatsRange} from './statsRange.js';

const error = (query: Parameters<typeof parseStatsRange>[0]) => {
    const result = parseStatsRange(query);
    return 'error' in result ? result.error : null;
};

test('rejects ranges over two years, reversed ranges and invalid input', () => {
    assert.equal(error({start: '0001-01-01', end: '9999-12-31'}), 'range_too_large');
    assert.equal(error({start: '2020-01-01', end: '2022-03-01'}), 'range_too_large');
    assert.equal(error({start: '2026-02-01', end: '2026-01-01'}), 'end_before_start');
    assert.equal(error({start: 'nope'}), 'invalid_date');
    assert.equal(error({interval: 'second'}), 'invalid_interval');
});

test('accepts the ranges used by the stats page', () => {
    assert.equal(error({}), null);
    assert.equal(error({start: '2024-01-01', end: '2025-12-31', interval: 'month'}), null);
});
