// Share as link: the notes as a public page on heynatively.com. The app sends
// the same document "Share as file" renders, with people's names only (never an
// email address), to natively-api (POST /v1/share) and keeps what comes back:
// the link and the token that turns it off. One JSON file in userData, keyed by
// meeting id, mode 0600, written to a temp file and renamed. The token only
// lets someone stop sharing, so it is not kept in the keychain.
//
// Plaintext on the server on purpose (Evin, 2026-10-16: the way Granola and
// Cluely do it). Pure where it can be: the payload, the size check and the
// store take no Electron, and the two calls take a fetch stand-in, so every
// branch is tested without the network. Both platforms run this one code path.

import * as fs from 'fs';
import * as path from 'path';
import type { NotesDocument } from './notesDocument';
import { ConnectionError, httpRequest, type FetchLike } from './httpRequest';
import type { ConnectionErrorKind, OutputResult, ShareLinkInfo } from '../../../src/types/meetingOutputs';

export const SHARE_LINKS_FILE = 'meeting-shares.json';
/** The server's body limit; over it, the request is refused before it is read. */
export const SHARE_MAX_BYTES = 1024 * 1024;

// ── The payload ──────────────────────────────────────────────────────────

export interface SharePayload {
    title: string;
    dateIso: string;
    dateLabel: string;
    durationLabel?: string;
    people: string[];
    sections: Array<{ heading: string; paragraph?: string; bullets: string[] }>;
    actionItems: Array<{ text: string; owner?: string; deadline?: string; done: boolean }>;
    transcript?: Array<{ speaker: string; text: string; offsetMs: number }>;
}

/**
 * What goes to the server. Names only: an attendee without a name is left
 * out rather than shown by email, and when the calendar gave no names at all
 * the people the transcript heard are used instead, as the file does.
 */
export function sharePayload(doc: NotesDocument, opts: { includeTranscript: boolean }): SharePayload {
    const named = doc.attendees.map((a) => a.name).filter((n): n is string => !!n);
    const people = [...new Set(named.length ? named : doc.participants)];
    return {
        title: doc.title,
        dateIso: doc.dateIso,
        dateLabel: doc.dateLabel,
        ...(doc.durationLabel ? { durationLabel: doc.durationLabel } : {}),
        people,
        sections: doc.sections.map((s) => ({ heading: s.heading, ...(s.paragraph ? { paragraph: s.paragraph } : {}), bullets: [...s.bullets] })),
        actionItems: doc.actionItems.map((a) => ({ text: a.text, ...(a.owner ? { owner: a.owner } : {}), ...(a.deadline ? { deadline: a.deadline } : {}), done: a.done })),
        ...(opts.includeTranscript && doc.transcript.length
            ? { transcript: doc.transcript.map((l) => ({ speaker: l.speaker, text: l.text, offsetMs: l.offsetMs })) }
            : {}),
    };
}

export function payloadBytes(payload: SharePayload): number {
    return Buffer.byteLength(JSON.stringify({ notes: payload }));
}

// ── The store ────────────────────────────────────────────────────────────

export interface ShareLinkRecord {
    id: string;
    url: string;
    revokeToken: string;
    createdAt: number;
    includeTranscript: boolean;
    /**
     * Still public, but due to be turned off: its meeting was deleted (or all
     * data cleared) while the server could not be reached, or the link could
     * not be saved here. Retried until the server confirms (ShareLinks.retryPending).
     */
    pendingRevoke?: boolean;
}

const ID_RE = /^[A-Za-z0-9]{8,32}$/;

function sanitizeRecord(raw: any): ShareLinkRecord | null {
    if (!raw || typeof raw !== 'object') return null;
    if (typeof raw.id !== 'string' || !ID_RE.test(raw.id)) return null;
    if (typeof raw.url !== 'string' || !/^https:\/\/[^\s"'<>]{1,300}$/.test(raw.url)) return null;
    if (typeof raw.revokeToken !== 'string' || !raw.revokeToken || raw.revokeToken.length > 200) return null;
    return {
        id: raw.id,
        url: raw.url,
        revokeToken: raw.revokeToken,
        createdAt: typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : 0,
        includeTranscript: raw.includeTranscript === true,
        ...(raw.pendingRevoke === true ? { pendingRevoke: true } : {}),
    };
}

/** What the renderer may see: the link and when, never the token. */
export function publicShareInfo(rec: ShareLinkRecord): ShareLinkInfo {
    return { url: rec.url, createdAt: rec.createdAt, includeTranscript: rec.includeTranscript };
}

export class ShareLinkStore {
    private cache: Record<string, ShareLinkRecord> | null = null;

    constructor(private readonly userDataDir: string) {}

    private file(): string {
        return path.join(this.userDataDir, SHARE_LINKS_FILE);
    }

    private load(): Record<string, ShareLinkRecord> {
        if (this.cache) return this.cache;
        const out: Record<string, ShareLinkRecord> = {};
        try {
            const raw = JSON.parse(fs.readFileSync(this.file(), 'utf8'));
            if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
                // Every record, however many: each holds the only token that
                // can turn its link off.
                for (const [meetingId, rec] of Object.entries(raw)) {
                    const clean = sanitizeRecord(rec);
                    if (clean && typeof meetingId === 'string' && meetingId) out[meetingId] = clean;
                }
            }
        } catch {
            // No file yet, or one that is not JSON: nothing is shared as far as the app knows.
        }
        this.cache = out;
        return out;
    }

    private save(): void {
        const data = this.load();
        fs.mkdirSync(this.userDataDir, { recursive: true });
        const tmp = `${this.file()}.${process.pid}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(data), { mode: 0o600 });
        fs.renameSync(tmp, this.file());
    }

    get(meetingId: string): ShareLinkRecord | null {
        return this.load()[meetingId] || null;
    }

    entries(): Array<[string, ShareLinkRecord]> {
        return Object.entries(this.load());
    }

    /** Saves the record. Throws when the file cannot be written; the record is then held in memory only. */
    set(meetingId: string, rec: ShareLinkRecord): void {
        this.load()[meetingId] = rec;
        this.save();
    }

    /**
     * Marks a link as due to be turned off. Kept in memory even when the file
     * cannot be written (then the retry only lasts this session). False when
     * the file was not written.
     */
    markPending(meetingId: string): boolean {
        const rec = this.load()[meetingId];
        if (!rec) return true;
        rec.pendingRevoke = true;
        return this.trySave();
    }

    /**
     * Forgets a link. Gone from memory at once; false when the file could not
     * be written (a later launch would then retry a link already off, which
     * the server answers as done).
     */
    remove(meetingId: string): boolean {
        const data = this.load();
        if (!(meetingId in data)) return true;
        delete data[meetingId];
        return this.trySave();
    }

    private trySave(): boolean {
        try {
            this.save();
            return true;
        } catch {
            return false;
        }
    }
}

// ── The two calls ────────────────────────────────────────────────────────

export interface ShareApiOptions {
    apiBase: string;
    installId?: string;
    fetchImpl?: FetchLike;
    timeoutMs?: number;
}

export type ShareCreateResult = OutputResult & { id?: string; url?: string; revokeToken?: string };

const SHARE_SERVICE = 'Natively';

/** The plain sentence for a failure. Never a status or a code. */
export function describeShareError(kind: ConnectionErrorKind | undefined, action: 'create' | 'revoke'): string {
    switch (kind) {
        case 'too_large': return 'These notes are too long to share as a link. Leave out the transcript and try again.';
        case 'rate_limited': return 'Too many links were made from this network just now. Wait a few minutes and try again.';
        case 'network': return 'Natively could not reach its server. Check your internet connection and try again.';
        case 'timeout': return 'The server took too long to answer. Check your connection and try again.';
        case 'server': return action === 'create'
            ? 'The link could not be made right now. Try again in a few minutes.'
            : 'The link could not be turned off right now. Try again in a few minutes.';
        case 'invalid_input': return 'The server did not accept these notes. Try again after the notes have finished.';
        case 'forbidden': return 'The server did not recognise this link as yours, so it stays on. Try again later.';
        default: return action === 'create'
            ? `Something went wrong talking to ${SHARE_SERVICE}. Try again.`
            : 'The link could not be turned off. Try again.';
    }
}

function failed(err: unknown, action: 'create' | 'revoke'): OutputResult & { kind: ConnectionErrorKind } {
    const kind: ConnectionErrorKind = err instanceof ConnectionError ? err.kind : 'unknown';
    return { ok: false, kind, message: describeShareError(kind, action) };
}

export async function createShareLink(payload: SharePayload, opts: ShareApiOptions): Promise<ShareCreateResult> {
    if (payloadBytes(payload) > SHARE_MAX_BYTES) return { ok: false, kind: 'too_large', message: describeShareError('too_large', 'create') };
    try {
        const res = await httpRequest(`${opts.apiBase}/v1/share`, {
            method: 'POST',
            json: { notes: payload },
            headers: opts.installId ? { 'x-install-id': opts.installId } : {},
            timeoutMs: opts.timeoutMs ?? 20_000,
            fetchImpl: opts.fetchImpl,
        });
        const d = res.data;
        if (!d?.ok || typeof d.id !== 'string' || typeof d.url !== 'string' || typeof d.revokeToken !== 'string') {
            return { ok: false, kind: 'server', message: describeShareError('server', 'create') };
        }
        return { ok: true, id: d.id, url: d.url, revokeToken: d.revokeToken };
    } catch (err) {
        return failed(err, 'create');
    }
}

/**
 * Turns a link off. A link the server no longer knows counts as off, so the
 * app's record can go either way.
 */
export async function revokeShareLink(id: string, revokeToken: string, opts: ShareApiOptions): Promise<OutputResult> {
    try {
        await httpRequest(`${opts.apiBase}/v1/share/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'x-share-revoke': revokeToken },
            timeoutMs: opts.timeoutMs ?? 15_000,
            fetchImpl: opts.fetchImpl,
        });
        return { ok: true };
    } catch (err) {
        if (err instanceof ConnectionError && err.kind === 'not_found') return { ok: true };
        return failed(err, 'revoke');
    }
}

// ── The whole flow ───────────────────────────────────────────────────────

export type ShareLinkResult = OutputResult & { link?: ShareLinkInfo };

const SAVE_FAILED_OFF = 'The link was made but could not be saved on this computer, so it was turned off again. Try again.';
const SAVE_FAILED_PENDING = 'The link was made but could not be saved on this computer, and it could not be turned off yet. Natively keeps trying while it is open.';
const STILL_TURNING_OFF = 'The last link for this meeting is still being turned off. Check your internet connection and try again in a minute.';

/**
 * Create, show and stop sharing, with one rule throughout: the app never
 * loses the token of a link that may still be public. A link whose meeting
 * goes away while the server cannot be reached is kept as "pending" and
 * retried until the server confirms it is off. The IPC layer adds only the
 * clipboard and the meeting lookup.
 */
export class ShareLinks {
    private retrying: Promise<number> | null = null;

    constructor(
        private readonly store: ShareLinkStore,
        private readonly api: () => ShareApiOptions,
        private readonly now: () => number = Date.now,
    ) {}

    /** The meeting's live link, or null. A link being turned off is not offered. */
    info(meetingId: string): ShareLinkInfo | null {
        const rec = this.store.get(meetingId);
        return rec && !rec.pendingRevoke ? publicShareInfo(rec) : null;
    }

    /** The link that exists, or a new one. The caller has checked the meeting has notes. */
    async create(meetingId: string, payload: SharePayload, includeTranscript: boolean): Promise<ShareLinkResult> {
        const existing = this.store.get(meetingId);
        if (existing && !existing.pendingRevoke) return { ok: true, link: publicShareInfo(existing) };
        if (existing) {
            // An earlier link still owed a turn-off: finish that first, so a
            // meeting never has two public links.
            const off = await revokeShareLink(existing.id, existing.revokeToken, this.api());
            if (!off.ok) return { ok: false, kind: off.kind, message: STILL_TURNING_OFF };
            this.store.remove(meetingId);
        }

        const res = await createShareLink(payload, this.api());
        if (!res.ok || !res.id || !res.url || !res.revokeToken) return { ok: false, kind: res.kind, message: res.message };
        const rec: ShareLinkRecord = { id: res.id, url: res.url, revokeToken: res.revokeToken, createdAt: this.now(), includeTranscript };
        try {
            this.store.set(meetingId, rec);
        } catch {
            // The link exists but could not be remembered on disk, so after a
            // restart it could never be turned off from here. Turn it off now,
            // and say so only once the server has confirmed it.
            const off = await revokeShareLink(rec.id, rec.revokeToken, this.api());
            if (off.ok) {
                this.store.remove(meetingId);
                return { ok: false, kind: 'storage_unavailable', message: SAVE_FAILED_OFF };
            }
            this.store.markPending(meetingId);
            return { ok: false, kind: 'storage_unavailable', message: SAVE_FAILED_PENDING };
        }
        return { ok: true, link: publicShareInfo(rec) };
    }

    /** Stop sharing, from the dialog. On failure the link stays on and the dialog keeps offering Stop sharing. */
    async revoke(meetingId: string): Promise<OutputResult> {
        const rec = this.store.get(meetingId);
        if (!rec) return { ok: true };
        const res = await revokeShareLink(rec.id, rec.revokeToken, this.api());
        if (res.ok) {
            this.store.remove(meetingId);
            return { ok: true };
        }
        return res;
    }

    /**
     * The meeting is being deleted. Its link is marked pending on disk before
     * this returns, so the delete never waits on the network and the token is
     * never lost; the turn-off runs in the background and is retried until the
     * server confirms. Answers the background run (how many are still pending).
     */
    forgetMeeting(meetingId: string): Promise<number> {
        if (!this.store.get(meetingId)) return Promise.resolve(0);
        this.store.markPending(meetingId);
        return this.retryPending();
    }

    /** "Clear all data": every link is due to be turned off; tries each now and keeps the rest pending. */
    revokeAll(): Promise<number> {
        for (const [meetingId] of this.store.entries()) this.store.markPending(meetingId);
        return this.retryPending();
    }

    private rerun: Promise<number> | null = null;

    /**
     * Tries every pending turn-off once and answers how many are still pending.
     * One run at a time; a call during a run queues one more run after it, so
     * a link marked pending mid-run is not left for the next timer.
     */
    retryPending(): Promise<number> {
        if (this.retrying) {
            if (!this.rerun) {
                this.rerun = this.retrying.then(() => {
                    this.rerun = null;
                    return this.retryPending();
                });
            }
            return this.rerun;
        }
        this.retrying = (async () => {
            try {
                const pending = this.store.entries().filter(([, rec]) => rec.pendingRevoke);
                await Promise.all(pending.map(async ([meetingId, rec]) => {
                    const res = await revokeShareLink(rec.id, rec.revokeToken, this.api());
                    // Only forget it if this is still the record that was tried.
                    if (res.ok && this.store.get(meetingId) === rec) this.store.remove(meetingId);
                }));
                return this.store.entries().filter(([, rec]) => rec.pendingRevoke).length;
            } finally {
                this.retrying = null;
            }
        })();
        return this.retrying;
    }
}
