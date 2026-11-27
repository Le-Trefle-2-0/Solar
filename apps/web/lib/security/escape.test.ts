import test from 'node:test';
import assert from 'node:assert/strict';
import {emailSubject, escapeDiscord, escapeHtml} from './escape';

test('HTML: markup and attributes are shown as text', () => {
    assert.equal(escapeHtml('<a href="https://x">Clique</a> & \'ok\''),
        '&lt;a href=&quot;https://x&quot;&gt;Clique&lt;/a&gt; &amp; &#39;ok&#39;');
    assert.equal(escapeHtml('ligne 1\n<b>ligne 2</b>', {lineBreaks: true}), 'ligne 1<br>&lt;b&gt;ligne 2&lt;/b&gt;');
    assert.equal(escapeHtml(undefined), '');
});

test('Discord: no mention, no link markup, no formatting', () => {
    const out = escapeDiscord('@everyone [site](https://evil) **gras** <@123>');
    assert.doesNotMatch(out, /@everyone/);
    assert.doesNotMatch(out, /<@123>/);
    assert.match(out, /\\\[site\\]\\\(https:\/\/evil\\\)/);
    assert.match(out, /\\\*\\\*gras\\\*\\\*/);
});

test('subjects: one bounded line', () => {
    assert.equal(emailSubject('Bonjour\r\nBcc: x@y.z'), 'Bonjour Bcc: x@y.z');
    assert.equal(emailSubject('a'.repeat(400)).length, 150);
});
