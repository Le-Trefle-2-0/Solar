import {test} from 'node:test';
import assert from 'node:assert/strict';
import {STAFF_ALIAS, visitorView} from './visitorView.js';

const volunteer = {id: 'u_42', name: 'Camille Martin', username: 'camille', image: 'https://cdn/x.png', role: 'Référent'};

test('visitors see "Bénévole Écoutant", never who the volunteer is', () => {
    const out = visitorView('message', {id: 1, author: volunteer, content: 'Bonjour', reactions: [{emoji: '👍', userID: 'u_42'}]}, 'v1') as any;
    assert.deepEqual(out.author, STAFF_ALIAS);
    assert.equal(out.reactions[0].userID, null);
    const typing = visitorView('typingIndicator', {id: 'c1', user: volunteer}, 'v1') as any;
    assert.deepEqual(typing.user, STAFF_ALIAS);
    const reaction = visitorView('reactionAdd', {messageID: 1, reaction: {emoji: '👍', userID: 'u_42'}}, 'v1') as any;
    assert.equal(reaction.reaction.userID, null);
});

test('the visitor keeps its own messages; presence and team notes are not sent', () => {
    const own = visitorView('message', {author: {id: 'v1', name: 'x', image: 'https://tracker'}}, 'v1') as any;
    assert.deepEqual(own.author, {id: 'v1', name: 'Utilisateur', image: null, role: null});
    assert.equal(visitorView('userJoined', {user: volunteer}, 'v1'), null);
    assert.equal(visitorView('message', {internal: true, author: volunteer}, 'v1'), null);
    assert.deepEqual(visitorView('ticketStatusUpdate', {channelId: 'c1', statusName: 'closed'}, 'v1'), {channelId: 'c1', statusName: 'closed'});
});
