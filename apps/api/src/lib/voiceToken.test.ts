import {test} from 'node:test';
import assert from 'node:assert/strict';
import {issueVoiceToken, verifyVoiceToken, VOICE_TOKEN_TTL_MS, voiceLink} from './voiceToken.js';

const SECRET = 'voice-test-secret';
const NOW = 1_800_000_000_000;

test('voice token: a fresh token verifies for its channel only', () => {
    const token = issueVoiceToken(SECRET, 'c1', NOW);
    assert.equal(token.exp, NOW + VOICE_TOKEN_TTL_MS);
    assert.equal(verifyVoiceToken(SECRET, token, NOW), true);
    assert.equal(verifyVoiceToken(SECRET, {...token, channelId: 'c2'}, NOW), false);
    assert.equal(verifyVoiceToken('other', token, NOW), false);
});

test('voice token: expired, too long-lived or malformed tokens are refused', () => {
    const token = issueVoiceToken(SECRET, 'c1', NOW);
    assert.equal(verifyVoiceToken(SECRET, token, token.exp + 1), false);
    const far = issueVoiceToken(SECRET, 'c1', NOW + VOICE_TOKEN_TTL_MS * 5);
    assert.equal(verifyVoiceToken(SECRET, far, NOW), false);
    for (const bad of [null, 'x', {}, {...token, t: 'é'.repeat(64)}, {...token, channelId: '../x'}, {...token, exp: 'soon'}]) {
        assert.equal(verifyVoiceToken(SECRET, bad, NOW), false, JSON.stringify(bad));
    }
});

test('voice link: points to the public page with the token', () => {
    const token = issueVoiceToken(SECRET, 'c1', NOW);
    const url = new URL(voiceLink('https://solar.example/', token));
    assert.equal(url.pathname, '/vocal/c1');
    assert.equal(url.searchParams.get('t'), token.t);
    assert.equal(Number(url.searchParams.get('e')), token.exp);
});
