import test from 'node:test';
import assert from 'node:assert/strict';
import {canDeleteFile, canLinkFile, canReadFile, fileResponseHeaders, isDocumentReviewer} from './fileAccess';

const volunteer = (userId: string) => ({userId, role: 'volunteer', permissions: ['tickets.send_message']});
const orphan = {uploadedById: 'u1', linkedUserIds: []};
const linked = {uploadedById: null, linkedUserIds: ['u1']};

test('the uploader can read their file', () => {
    assert.equal(canReadFile(volunteer('u1'), orphan), true);
});

test('the user the file is linked to can read it', () => {
    assert.equal(canReadFile(volunteer('u1'), linked), true);
});

test('another volunteer cannot read it', () => {
    assert.equal(canReadFile(volunteer('u2'), orphan), false);
    assert.equal(canReadFile(volunteer('u2'), linked), false);
});

const reviewer = {userId: 'm', role: 'référent', permissions: ['management.manage_accounts']};

test('a file with no known owner is only readable by reviewers', () => {
    const unknown = {uploadedById: null, linkedUserIds: []};
    assert.equal(canReadFile(volunteer('u1'), unknown), false);
    assert.equal(canReadFile(reviewer, unknown), true);
});

test('reviewers: manage_accounts or sudo, whatever the role is called', () => {
    assert.equal(isDocumentReviewer(reviewer), true);
    assert.equal(isDocumentReviewer({userId: 'a', role: 'x', permissions: ['admin.sudo']}), true);
    assert.equal(isDocumentReviewer({userId: 'a', role: 'volunteer', permissions: ['tickets.read_all']}), false);
    // A role name alone grants nothing
    assert.equal(isDocumentReviewer({userId: 'a', role: 'admin,manager', permissions: []}), false);
});

test('only reviewers can delete', () => {
    assert.equal(canDeleteFile(volunteer('u1')), false);
    assert.equal(canDeleteFile(reviewer), true);
});

test("a user cannot link someone else's file to their profile", () => {
    assert.equal(canLinkFile('u1', {uploadedById: 'u1'}), true);
    assert.equal(canLinkFile('u2', {uploadedById: 'u1'}), false);
    assert.equal(canLinkFile('u1', {uploadedById: null}), false);
    assert.equal(canLinkFile('u1', null), false);
});

test('served files: nosniff, and unknown types are downloaded as octet-stream', () => {
    const pdf = fileResponseHeaders('application/pdf', 'id.pdf', 4);
    assert.equal(pdf['x-content-type-options'], 'nosniff');
    assert.match(pdf['content-disposition'], /^inline;/);
    const html = fileResponseHeaders('text/html', 'x.html', 4);
    assert.equal(html['content-type'], 'application/octet-stream');
    assert.match(html['content-disposition'], /^attachment;/);
});
