/**
 * Provider speaker labels ("diarization"), shared by the providers that can
 * label voices on a live stream and by main.ts, which decides when to ask.
 *
 * Natively never tells voices apart itself: a provider labels each word or
 * token with a voice, and this turns those labels into the transcript's
 * canonical ids (`speaker_<n>`). Two uses, both opt-in:
 *   - the meeting-audio channel, behind the speakerDiarizationV1 flag, so a
 *     panel on the other side can be told apart;
 *   - the microphone, when the user turns on "People sharing your microphone"
 *     (Settings › Audio): the voices are split at save by
 *     services/meeting/roomSpeakers.ts.
 *
 * Which live APIs can label voices (checked against each provider's docs,
 * 2026-10-17):
 *   deepgram  `diarize=true`, a `speaker` index per word
 *   soniox    `enable_speaker_diarization`, a `speaker` label per token
 *   google    v1 `diarizationConfig`, a `speakerLabel` per word
 *   natively  the relay (natively-api) asks Soniox when the auth frame says
 *             `speaker_labels: true`, and sends `speaker` + `speaker_epoch`;
 *             a session it fails over to another provider has no labels
 * and which cannot: OpenAI realtime (labels only on whole-file transcription),
 * Groq (Whisper), ElevenLabs realtime (labels only on batch Scribe), Azure and
 * IBM over REST (each short clip is its own request, so labels do not carry
 * from one clip to the next), NVIDIA's hosted NIM (streaming labels are a beta
 * that needs a specific server model), Apple Speech and the local models.
 *
 * Platform-neutral: no OS branches, same on macOS and Windows.
 */

/**
 * Providers whose live stream can label voices. The renderer keeps its own
 * copy (RoomSpeakersSettings.ROOM_SPEAKERS_PROVIDERS, it cannot import from
 * electron/); RoomSpeakersProviders2026_10_17.test.mjs pins the two equal and
 * pins that each provider here has `setDiarization`.
 */
export const DIARIZING_STT_PROVIDERS: ReadonlySet<string> = new Set(['natively', 'deepgram', 'soniox', 'google']);

/** A provider that can be asked to label voices. */
export interface DiarizingSTT {
    setDiarization(enabled: boolean): void;
}

export function canDiarize(stt: unknown): stt is DiarizingSTT {
    return !!stt && typeof (stt as { setDiarization?: unknown }).setDiarization === 'function';
}

/**
 * Whether a stream on this channel should label voices. The mic is one person
 * unless the user said otherwise; diarizing it would cost latency for nothing.
 */
export function shouldDiarize(channel: string, opts: { roomSpeakers: boolean; remoteFlag: boolean }): boolean {
    if (channel === 'user') return opts.roomSpeakers;
    if (channel === 'interviewer') return opts.remoteFlag;
    return false;
}

/**
 * A provider's 1-based voice label as a canonical id. Soniox sends "1", "2";
 * Google sends speakerLabel "1" or speakerTag 1. Anything else that is a
 * non-empty label still gets a stable id; nothing usable gives undefined.
 */
export function voiceIdFromLabel(label: unknown): string | undefined {
    if (typeof label === 'number') return Number.isInteger(label) && label >= 1 ? `speaker_${label}` : undefined;
    if (typeof label !== 'string') return undefined;
    const s = label.trim();
    if (!s) return undefined;
    if (/^\d+$/.test(s)) return Number(s) >= 1 ? `speaker_${Number(s)}` : undefined;
    const safe = s.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return safe ? `speaker_${safe}` : undefined;
}

/**
 * Consecutive pieces (Soniox tokens) grouped into one run per voice, so a
 * message in which two people speak becomes two finals, each with its voice.
 * A piece with no label joins the run it sits in (punctuation, spacing).
 */
export function runsByVoice<T>(
    pieces: readonly T[],
    textOf: (p: T) => string,
    labelOf: (p: T) => unknown,
): Array<{ text: string; speakerId?: string }> {
    const runs: Array<{ text: string; speakerId?: string }> = [];
    for (const p of pieces) {
        const text = textOf(p);
        if (!text) continue;
        const id = voiceIdFromLabel(labelOf(p));
        const last = runs[runs.length - 1];
        if (last && (id === undefined || last.speakerId === undefined || id === last.speakerId)) {
            last.text += text;
            if (last.speakerId === undefined && id !== undefined) last.speakerId = id;
            continue;
        }
        runs.push({ text, ...(id !== undefined ? { speakerId: id } : {}) });
    }
    return runs.filter((r) => r.text.trim().length > 0);
}

/**
 * The voice that said most of the last `count` words. Google, with labels on,
 * resends every word since the stream opened in each response; the result in
 * hand is the tail of that list.
 */
export function dominantVoiceOfTail(
    words: ReadonlyArray<{ speakerLabel?: unknown; speakerTag?: unknown }> | null | undefined,
    count: number,
): string | undefined {
    if (!Array.isArray(words) || words.length === 0 || count <= 0) return undefined;
    const tally = new Map<string, number>();
    for (const w of words.slice(-count)) {
        const id = voiceIdFromLabel(w?.speakerLabel) ?? voiceIdFromLabel(w?.speakerTag);
        if (id) tally.set(id, (tally.get(id) ?? 0) + 1);
    }
    let best: string | undefined;
    let bestCount = 0;
    for (const [id, c] of tally) if (c > bestCount) { best = id; bestCount = c; }
    return best;
}

/**
 * Voice numbers restart on every new provider connection (a reconnect, or
 * Google's 4.5-minute stream restart), so "speaker_1" before and after one may
 * be different people. Mic voice ids therefore carry the connection they came
 * from, `speaker_2@3`; roomSpeakers.ts reads each connection as its own window.
 * The provider voice ids never reach disk (MeetingPersistence strips them).
 */
export function withVoiceEpoch(speakerId: string, epoch: number | undefined): string {
    return typeof epoch === 'number' && Number.isInteger(epoch) && epoch >= 0 ? `${speakerId}@${epoch}` : speakerId;
}

export function parseVoiceId(id: string): { voice: string; epoch: string } {
    const at = id.lastIndexOf('@');
    return at > 0 ? { voice: id.slice(0, at), epoch: id.slice(at + 1) } : { voice: id, epoch: '' };
}
