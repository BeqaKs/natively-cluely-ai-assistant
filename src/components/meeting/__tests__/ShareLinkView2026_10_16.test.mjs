// Share as link (2026-10-16), renderer side: the dialog never offers Create
// link before it knows whether the meeting already has one.
// Run: node --experimental-strip-types --test <this file>
import { test } from 'node:test';
import assert from 'node:assert/strict';

const v = await import('../outputsView.ts');

test('the dialog reads first, then offers a link or shows the one that exists', () => {
    assert.deepEqual(v.shareLinkView(false, null), { state: 'reading' });
    assert.deepEqual(v.shareLinkView(false, { url: 'https://heynatively.com/s/AbCdEfGhIjKl', createdAt: 1, includeTranscript: false }), { state: 'reading' }, 'nothing is shown until the read answered');
    assert.deepEqual(v.shareLinkView(true, null), { state: 'none' });
    assert.deepEqual(v.shareLinkView(true, { url: 'https://heynatively.com/s/AbCdEfGhIjKl', createdAt: 1, includeTranscript: true }), { state: 'shared' });
});
