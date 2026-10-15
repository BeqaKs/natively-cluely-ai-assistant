// Share as link (2026-10-16): the payload the app sends (names, never an email
// address), the size check, the record store (a plain JSON file in userData)
// and the two server calls through a fake fetch. Nothing here touches the
// network or Electron.
//
// Run (after `npm run build:electron`):
//   node scripts/run-with-env.mjs --default-tmpdir NATIVELY_TEST_USERDATA=natively-test-userdata \
//     --set ELECTRON_RUN_AS_NODE=1 -- electron --test --test-force-exit <this file>
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const dist = (p) => require(path.join(REPO, 'dist-electron/electron/services/outputs', p));
const share = dist('shareLink.js');
const notes = dist('notesDocument.js');

const T0 = Date.UTC(2026, 9, 14, 15, 0, 0);
function meeting(over = {}) {
    return {
        id: 'm1',
        title: 'Q4 pricing review',
        date: '2026-10-14T15:00:00.000Z',
        duration: '45:10',
        detailedSummary: {
            schemaVersion: 3,
            tldr: ['Agreed to hold **list price** flat'],
            sectionsV3: [{ id: 's1', title: 'Pricing', order: 1, bullets: [{ text: 'Annual plans get `2 months` free' }] }],
            actionItemsV3: [{ text: 'Send the new price sheet', owner: 'Dana', deadline: 'Friday', status: 'open' }, { text: 'Update CRM', status: 'done' }],
            speakerLabels: { speaker_2: 'Priya' },
            callParticipants: ['Dana', 'Priya'],
        },
        transcript: [
            { speaker: 'user', text: 'Let us hold the price.', timestamp: T0 },
            { speaker: 'speaker_2', text: 'Agreed.', timestamp: T0 + 65_000 },
        ],
        calendarEvent: { attendees: [{ email: 'dana@acme.com', name: 'Dana Li' }, { email: 'priya@acme.com' }] },
        ...over,
    };
}
const doc = (over) => notes.buildNotesDocument(meeting(over), { selfName: 'Evin', locale: 'en-GB', timeZone: 'UTC' });

// A fetch stand-in: answers in order, records what was sent.
function fakeFetch(answers) {
    const calls = [];
    const fetchImpl = async (url, init) => {
        calls.push({ url, init });
        const next = answers.shift();
        if (next instanceof Error) throw next;
        const body = typeof next.body === 'string' ? next.body : JSON.stringify(next.body ?? {});
        return { ok: next.status < 400, status: next.status, headers: { get: () => null }, text: async () => body };
    };
    return { fetchImpl, calls };
}
const OPTS = (fetchImpl, extra = {}) => ({ apiBase: 'https://api.example.test', fetchImpl, timeoutMs: 1000, ...extra });

describe('sharePayload', () => {
    test('sends the notes with names only: an attendee without a name is left out, never shown by email', () => {
        const p = share.sharePayload(doc(), { includeTranscript: false });
        assert.equal(p.title, 'Q4 pricing review');
        assert.equal(p.dateIso, '2026-10-14T15:00:00.000Z');
        assert.equal(p.dateLabel, 'Wednesday, 14 October 2026');
        assert.equal(p.durationLabel, '45 min');
        assert.deepEqual(p.people, ['Dana Li']);
        assert.deepEqual(p.sections, [
            { heading: 'Summary', bullets: ['Agreed to hold **list price** flat'] },
            { heading: 'Pricing', bullets: ['Annual plans get `2 months` free'] },
        ]);
        assert.deepEqual(p.actionItems, [
            { text: 'Send the new price sheet', owner: 'Dana', deadline: 'Friday', done: false },
            { text: 'Update CRM', done: true },
        ]);
        assert.equal('transcript' in p, false);
        assert.equal(JSON.stringify(p).includes('@'), false, 'no email address anywhere in the payload');
    });
    test('without any named attendee the people the transcript heard are used; the transcript goes only when asked', () => {
        const p = share.sharePayload(doc({ calendarEvent: { attendees: [{ email: 'x@acme.com' }] } }), { includeTranscript: true });
        assert.deepEqual(p.people, ['Dana', 'Priya']);
        assert.deepEqual(p.transcript, [
            { speaker: 'Evin', text: 'Let us hold the price.', offsetMs: 0 },
            { speaker: 'Priya', text: 'Agreed.', offsetMs: 65_000 },
        ]);
        assert.equal(JSON.stringify(p).includes('@'), false);
    });
    test('the size check counts the body as sent', () => {
        const p = share.sharePayload(doc(), { includeTranscript: false });
        assert.equal(share.payloadBytes(p), Buffer.byteLength(JSON.stringify({ notes: p })));
        assert.equal(share.SHARE_MAX_BYTES, 1024 * 1024);
    });
});

describe('ShareLinkStore', () => {
    const dir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'natively-shares-'));
    const REC = { id: 'AbCdEfGhIjKl', url: 'https://heynatively.com/s/AbCdEfGhIjKl', revokeToken: 'tok-123', createdAt: 1700000000000, includeTranscript: true };
    test('round-trips a record through the file, keeps the token out of the renderer view, and forgets on remove', () => {
        const d = dir();
        const s = new share.ShareLinkStore(d);
        assert.equal(s.get('m1'), null);
        s.set('m1', REC);
        assert.deepEqual(new share.ShareLinkStore(d).get('m1'), REC);
        assert.deepEqual(share.publicShareInfo(REC), { url: REC.url, createdAt: REC.createdAt, includeTranscript: true });
        if (process.platform !== 'win32') assert.equal(fs.statSync(path.join(d, share.SHARE_LINKS_FILE)).mode & 0o777, 0o600);
        assert.equal(fs.readdirSync(d).some((f) => f.endsWith('.tmp')), false, 'no temp file left behind');
        s.remove('m1');
        assert.equal(new share.ShareLinkStore(d).get('m1'), null);
        s.remove('m1');
    });
    test('a file that is not JSON, or holds records of the wrong shape, reads as nothing shared', () => {
        const d = dir();
        fs.writeFileSync(path.join(d, share.SHARE_LINKS_FILE), '{not json');
        assert.equal(new share.ShareLinkStore(d).get('m1'), null);
        fs.writeFileSync(path.join(d, share.SHARE_LINKS_FILE), JSON.stringify({
            m1: { id: 'bad id!', url: REC.url, revokeToken: 't' },
            m2: { id: REC.id, url: 'http://not-https.example/s/x', revokeToken: 't' },
            m3: { id: REC.id, url: REC.url, revokeToken: '' },
            m4: { id: REC.id, url: REC.url, revokeToken: 't', createdAt: 'yesterday', includeTranscript: 'yes' },
        }));
        const s = new share.ShareLinkStore(d);
        assert.equal(s.get('m1'), null);
        assert.equal(s.get('m2'), null);
        assert.equal(s.get('m3'), null);
        assert.deepEqual(s.get('m4'), { id: REC.id, url: REC.url, revokeToken: 't', createdAt: 0, includeTranscript: false });
    });
    test('a store under a path that is not a directory fails loudly on save', () => {
        const d = dir();
        const file = path.join(d, 'file');
        fs.writeFileSync(file, 'x');
        const s = new share.ShareLinkStore(path.join(file, 'inside'));
        assert.throws(() => s.set('m1', REC));
    });
});

describe('createShareLink', () => {
    const payload = share.sharePayload(doc(), { includeTranscript: false });
    test('posts the notes with the install id and hands back the id, link and token', async () => {
        const { fetchImpl, calls } = fakeFetch([{ status: 200, body: { ok: true, id: 'AbCdEfGhIjKl', url: 'https://heynatively.com/s/AbCdEfGhIjKl', revokeToken: 'tok' } }]);
        const res = await share.createShareLink(payload, OPTS(fetchImpl, { installId: 'uuid-1' }));
        assert.deepEqual(res, { ok: true, id: 'AbCdEfGhIjKl', url: 'https://heynatively.com/s/AbCdEfGhIjKl', revokeToken: 'tok' });
        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, 'https://api.example.test/v1/share');
        assert.equal(calls[0].init.method, 'POST');
        assert.equal(calls[0].init.headers['x-install-id'], 'uuid-1');
        assert.deepEqual(JSON.parse(calls[0].init.body), { notes: payload });
    });
    test('each failure is a plain sentence: too long, rate limited, offline, server trouble, odd answer', async () => {
        let r = await share.createShareLink(payload, OPTS(fakeFetch([{ status: 413, body: { ok: false, error: 'too_long' } }]).fetchImpl));
        assert.equal(r.ok, false); assert.equal(r.kind, 'too_large'); assert.match(r.message, /too long to share as a link/);
        r = await share.createShareLink(payload, OPTS(fakeFetch([{ status: 429, body: { error: 'rate_limited' } }]).fetchImpl));
        assert.equal(r.kind, 'rate_limited'); assert.match(r.message, /Too many links/);
        r = await share.createShareLink(payload, OPTS(fakeFetch([new TypeError('fetch failed')]).fetchImpl));
        assert.equal(r.kind, 'network'); assert.match(r.message, /could not reach its server/);
        r = await share.createShareLink(payload, OPTS(fakeFetch([{ status: 503, body: { ok: false, error: 'unavailable' } }]).fetchImpl));
        assert.equal(r.kind, 'server'); assert.match(r.message, /could not be made right now/);
        r = await share.createShareLink(payload, OPTS(fakeFetch([{ status: 200, body: { ok: true } }]).fetchImpl));
        assert.equal(r.kind, 'server');
        for (const m of [r.message]) { assert.doesNotMatch(m, /\b[45]\d\d\b/, 'no status number on screen'); }
    });
    test('a payload over the server limit is refused before anything is sent', async () => {
        const { fetchImpl, calls } = fakeFetch([]);
        const big = { ...payload, transcript: Array.from({ length: 600 }, () => ({ speaker: 'A', text: 'x'.repeat(1900), offsetMs: 0 })) };
        const r = await share.createShareLink(big, OPTS(fetchImpl));
        assert.equal(r.ok, false); assert.equal(r.kind, 'too_large');
        assert.equal(calls.length, 0);
    });
});

describe('revokeShareLink', () => {
    test('sends the token as a header; a link the server no longer knows counts as off', async () => {
        const { fetchImpl, calls } = fakeFetch([{ status: 200, body: { ok: true } }, { status: 404, body: { ok: false, error: 'not_found' } }]);
        assert.deepEqual(await share.revokeShareLink('AbCdEfGhIjKl', 'tok', OPTS(fetchImpl)), { ok: true });
        assert.equal(calls[0].url, 'https://api.example.test/v1/share/AbCdEfGhIjKl');
        assert.equal(calls[0].init.method, 'DELETE');
        assert.equal(calls[0].init.headers['x-share-revoke'], 'tok');
        assert.deepEqual(await share.revokeShareLink('AbCdEfGhIjKl', 'tok', OPTS(fetchImpl)), { ok: true });
    });
    test('a wrong token, a server fault or no connection leaves the link on and says so', async () => {
        let r = await share.revokeShareLink('AbCdEfGhIjKl', 'tok', OPTS(fakeFetch([{ status: 403, body: { ok: false } }]).fetchImpl));
        assert.equal(r.ok, false); assert.match(r.message, /stays on/);
        r = await share.revokeShareLink('AbCdEfGhIjKl', 'tok', OPTS(fakeFetch([{ status: 503, body: {} }]).fetchImpl));
        assert.equal(r.ok, false); assert.match(r.message, /could not be turned off right now/);
        r = await share.revokeShareLink('AbCdEfGhIjKl', 'tok', OPTS(fakeFetch([new TypeError('fetch failed')]).fetchImpl));
        assert.equal(r.ok, false); assert.equal(r.kind, 'network');
    });
});
